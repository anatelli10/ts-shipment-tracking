import { fedex, getTracking, s10, ups, usps } from 'ts-tracking-number';
import { TrackingInfo, TrackingOptions } from './util/types';
import { trackFedex } from './couriers/fedex';
import { trackUps } from './couriers/ups';
import { trackUsps } from './couriers/usps';

export { TrackingInfo, TrackingEvent, TrackingOptions } from './util/types';
export { trackFedex } from './couriers/fedex';
export { trackUps } from './couriers/ups';
export { trackUsps } from './couriers/usps';

const codeTrackingMap = {
  fedex: trackFedex,
  ups: trackUps,
  usps: trackUsps,
  s10: trackUsps
} as const;

function assertValidCode(value: string | undefined): asserts value is keyof typeof codeTrackingMap {
  if (value == null || !(value in codeTrackingMap))
    throw new Error(
      `"${value}" is not a valid courier code.
      Valid courier codes are ${Object.keys(codeTrackingMap)}`
    );
}

export const trackByCourier = (
  courierCode: string | undefined,
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  if (courierCode === undefined) {
    throw new Error(`"${trackingNumber}" is not a valid tracking number.`);
  }

  assertValidCode(courierCode);

  return codeTrackingMap[courierCode](trackingNumber, options);
};

export const track = (trackingNumber: string, options?: TrackingOptions): Promise<TrackingInfo> =>
  trackByCourier(
    getTracking(trackingNumber, [fedex, ups, usps, s10])?.courier.code,
    trackingNumber,
    options
  );
