import { fedex, getTracking, s10, ups, usps } from 'ts-tracking-number';
import { TrackingInfo } from './util/types';
import { trackFedex } from './couriers/fedex';
import { trackUps } from './couriers/ups';
import { trackUsps } from './couriers/usps';

export { TrackingInfo, TrackingEvent } from './util/types';
export { trackFedex } from './couriers/fedex';
export { trackUps } from './couriers/ups';
export { trackUsps } from './couriers/usps';

export const trackByCourier = (
  courierCode: string,
  trackingNumber: string
): Promise<TrackingInfo | undefined> =>
  (courierCode === 'fedex' ? trackFedex : courierCode === 'ups' ? trackUps : trackUsps)(
    trackingNumber
  );

export const track = (trackingNumber: string): Promise<TrackingInfo | undefined> =>
  trackByCourier(
    getTracking(trackingNumber, [fedex, ups, usps, s10])?.courier.code ?? '',
    trackingNumber
  );
