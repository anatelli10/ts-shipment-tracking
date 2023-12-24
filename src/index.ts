import { TrackingInfo, TrackingOptions } from './types';
import {
  assertValidCode,
  courierCodeMap,
  getCourierCode,
  trackCourier,
} from './utils';

export * from './types';

export const track = async (
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  const courierCode = options?.courierCode ?? getCourierCode(trackingNumber);

  assertValidCode(courierCode);

  const courier = courierCodeMap[courierCode];
  const trackingInfo = await trackCourier(courier, trackingNumber, options);

  return trackingInfo;
};
