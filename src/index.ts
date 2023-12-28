import { Courier, TrackingInfo, TrackingOptions } from './types';
// prettier-ignore
import { assertValidCode, courierCodeMap, getCourierCode, getEnvUrl, xmlToJs } from './utils';

export * from './types';

const parseTrackInfo = <CourierName, CourierCode>(
  response: any,
  { name: courierName, parseOptions }: Courier<CourierName, CourierCode>
): TrackingInfo => {
  const shipment = parseOptions.getShipment(response);

  if (parseOptions.checkForError(response, shipment)) {
    // prettier-ignore
    throw new Error(
`Error found in the following ${courierName} tracking response:

    ${JSON.stringify(response)}
`
    );
  }

  if (shipment == null) {
    // prettier-ignore
    throw new Error(
`"getShipment" function ${parseOptions.getShipment.toString()} could not find the shipment in the following ${courierName} tracking response:
    
    ${JSON.stringify(response)}
`
    );
  }

  const events = parseOptions.getTrackingEvents(shipment);
  const estimatedDeliveryTime =
    parseOptions.getEstimatedDeliveryTime?.(shipment);

  return {
    events,
    estimatedDeliveryTime,
  };
};

const trackForCourier = async <CourierName, CourierCode>(
  courier: Courier<CourierName, CourierCode>,
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  /**
   * Ensure credentials are present
   */
  courier.requiredEnvVars?.forEach((v) => {
    if (!process.env[v]) {
      throw new Error(
        `Environment variable "${v}" must be set in order to use ${courier.name} tracking.`
      );
    }
  });

  const { fetchTracking, parseResponseAsXml, urls } = courier.fetchOptions;
  const url = getEnvUrl({ urls, explicitEnv: options?.env });

  const response = await fetchTracking(url, trackingNumber);
  const parsedResponse = parseResponseAsXml
    ? xmlToJs(await response.text())
    : await response.json();

  const trackingInfo = parseTrackInfo(parsedResponse, courier);

  return trackingInfo;
};

export const track = async (
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  const courierCode = options?.courierCode ?? getCourierCode(trackingNumber);

  assertValidCode(courierCode);

  const courier = courierCodeMap[courierCode];
  const trackingInfo = await trackForCourier(courier, trackingNumber, options);

  return trackingInfo;
};
