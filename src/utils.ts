import { XMLParser } from 'fast-xml-parser';
import { path } from 'ramda';
import { getTracking } from 'ts-tracking-number';
import * as couriers from './couriers';
import { Courier, Couriers, TrackingInfo } from './types';

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
    throw new Error(`"${trackingNumber}" is not a valid tracking number.`);
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

export const parseTrackInfo = <CourierCode>(
  response: any,
  { name: courierName, parseOptions }: Courier<CourierCode>
) => {
  const json = parseOptions?.isXML ? XML.parse(response) : response;

  const trackInfo = path(parseOptions.shipmentItemPath, json);

  if (trackInfo == null || parseOptions.checkForError(json, trackInfo)) {
    throw new Error(`Error retrieving ${courierName} tracking.

    Response:
    ${JSON.stringify(response)}
    `);
  }

  const events = parseOptions.getTrackingEvents(trackInfo);
  const estimatedDeliveryDate =
    parseOptions.getEstimatedDeliveryDate?.(trackInfo);

  return {
    events,
    estimatedDeliveryDate,
  };
};

export const trackCourier = async <CourierCode>(
  courier: Courier<CourierCode>,
  trackingNumber: string
): Promise<TrackingInfo> => {
  courier.requiredEnvVars?.forEach((v) => {
    if (!process.env[v]) {
      throw new Error(
        `Environment variable "${v}" must be set in order to use ${courier.name} tracking.`
      );
    }
  });

  const response = await courier.request(trackingNumber);
  const trackingInfo = parseTrackInfo(response, courier);

  return trackingInfo;
};
