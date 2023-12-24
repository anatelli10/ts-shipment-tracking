import { XMLParser } from 'fast-xml-parser';
import { getTracking } from 'ts-tracking-number';
import * as couriers from './couriers';
import { Courier, Couriers, TrackingInfo, TrackingOptions } from './types';

export const XML = new XMLParser({
  parseTagValue: false,
});

// A map of courier definitions keyed by their code
export const courierCodeMap = Object.values(couriers).reduce(
  (map, courier) => ({ ...map, [courier.code]: courier }),
  // Initialize the map to use USPS tracking for S10 codes
  { s10: couriers.USPS } as { s10: Courier<typeof couriers.USPS.code> } & {
    // The output type isn't inferenced automatically, manually specify it
    [CourierCode in keyof Couriers as Couriers[CourierCode]['code']]: Couriers[CourierCode];
  }
);

const supportedCouriers = Object.values(couriers).flatMap(
  ({ tsTrackingNumberCouriers }) => tsTrackingNumberCouriers
);

export const getCourierCode = (trackingNumber: string) => {
  const tracking = getTracking(trackingNumber, supportedCouriers);

  if (!tracking) {
    const supportedCourierNames = Object.values(couriers).map(
      ({ name }) => name
    );
    throw new Error(
      `"${trackingNumber}" is not a valid tracking number for supported couriers. Supported couriers are ${supportedCourierNames}.`
    );
  }

  return tracking.courier.code;
};

export function assertValidCode(
  value: string | undefined
): asserts value is keyof typeof courierCodeMap {
  if (value == null || !(value in courierCodeMap))
    throw new Error(
      `"${value}" is not a valid courier code.
      Valid courier codes are ${Object.keys(courierCodeMap)}`
    );
}

// Adapted from Ramda: https://github.com/ramda/ramda/blob/96d601016b562e887e15efd894ec401672f73757/source/paths.js#L23
const path = (paths: (string | number)[], obj: any) => {
  var val = obj;
  var idx = 0;
  var p;
  while (idx < paths.length) {
    if (val == null) {
      return;
    }
    p = paths[idx];

    val = val[p];
    idx += 1;
  }
  return val;
};

export const getEnvUrl = ({
  devUrl,
  prodUrl,
  explicitEnv,
}: {
  devUrl: string;
  prodUrl: string;
  explicitEnv?: TrackingOptions['env'];
}) => {
  if (explicitEnv) {
    return explicitEnv === 'production' ? prodUrl : devUrl;
  }

  return process.env.NODE_ENV === 'production' ? prodUrl : devUrl;
};

export const parseTrackInfo = <CourierCode>(
  response: any,
  { name: courierName, parseOptions }: Courier<CourierCode>
) => {
  const shipment = path(parseOptions.shipmentPath, response);

  if (shipment == null || parseOptions.checkForError(response, shipment)) {
    throw new Error(`Error retrieving ${courierName} tracking.

    Response:
    ${JSON.stringify(response)}
    `);
  }

  const events = parseOptions.getTrackingEvents(shipment);
  const estimatedDeliveryTime =
    parseOptions.getEstimatedDeliveryTime?.(shipment);

  return {
    events,
    estimatedDeliveryTime,
  };
};

export const trackCourier = async <CourierCode>(
  courier: Courier<CourierCode>,
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  courier.requiredEnvVars?.forEach((v) => {
    if (!process.env[v]) {
      throw new Error(
        `Environment variable "${v}" must be set in order to use ${courier.name} tracking.`
      );
    }
  });

  const { devUrl, prodUrl, parameters, responseType } = courier.fetchOptions;

  const url = getEnvUrl({
    devUrl,
    prodUrl,
    explicitEnv: options?.env,
  });

  const response = await fetch(
    parameters.input(url, trackingNumber),
    parameters.init?.(url, trackingNumber)
  );
  const parsedResponse =
    responseType === 'XML'
      ? XML.parse(await response.text())
      : await response.json();

  const trackingInfo = parseTrackInfo(parsedResponse, courier);

  return trackingInfo;
};
