import { getTracking } from 'ts-tracking-number';
import { Courier, TrackingInfo, TrackingOptions } from './util/types';
import * as couriers from './couriers';

export type Couriers = typeof couriers;
export * from './util/types';

// A map of courier definitions keyed by their code
const courierCodeMap = Object.values(couriers).reduce(
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

const getCourierCode = (trackingNumber: string) => {
  const tracking = getTracking(trackingNumber, supportedCouriers);

  if (!tracking) {
    throw new Error(`"${trackingNumber}" is not a valid tracking number.`);
  }

  return tracking.courier.code;
};

function assertValidCode(
  value: string | undefined
): asserts value is keyof typeof courierCodeMap {
  if (value == null || !(value in courierCodeMap))
    throw new Error(
      `"${value}" is not a valid courier code.
      Valid courier codes are ${Object.keys(courierCodeMap)}`
    );
}

const trackCourier = async <CourierCode>(
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
  const trackingInfo = courier.parse(response);

  return trackingInfo;
};

export const track = async (
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  const courierCode = options?.courierCode ?? getCourierCode(trackingNumber);

  assertValidCode(courierCode);

  const courier = courierCodeMap[courierCode];
  const trackingInfo = await trackCourier(courier, trackingNumber);

  return trackingInfo;
};
