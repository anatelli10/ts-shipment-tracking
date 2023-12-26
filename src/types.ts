import { TrackingCourier } from 'ts-tracking-number';
import * as couriers from './couriers';

export type Couriers = typeof couriers;

export enum TrackingStatus {
  LABEL_CREATED = 'LABEL_CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERY_ATTEMPTED = 'DELIVERY_ATTEMPTED',
  RETURNED_TO_SENDER = 'RETURNED_TO_SENDER',
  EXCEPTION = 'EXCEPTION',
  DELIVERED = 'DELIVERED',
}

export type TrackingEvent = {
  /**
   * Previously contained status 'UNAVAILABLE', this status has been removed in favor of `undefined`
   */
  status?: TrackingStatus;
  label?: string;
  location?: string;
  /**
   * Previously named `date`
   */
  time?: number;
};

export type TrackingInfo = {
  events: TrackingEvent[];
  /**
   * Previously named `estimatedDeliveryDate`
   */
  estimatedDeliveryTime?: number;
};

export type TrackingOptions = {
  /**
   * Explicitly define a courier code to bypass auto-detection
   */
  courierCode?: Couriers[keyof Couriers]['code'];
  /**
   * By default, `process.env.NODE_ENV` is used to determine whether to use courier's dev or prod env.
   * Explicitly define an environment to override this.
   */
  env?: 'development' | 'production';
};

export type FetchOptions = {
  urls: {
    dev: string;
    prod: string;
  };
  /**
   * Arguments to use for the fetch request built using the URL (determined by environment) and tracking number
   */
  parameters: {
    /**
     * The first argument, typically a url
     */
    input: (url: string, trackingNumber: string) => Parameters<typeof fetch>[0];
    /**
     * The second argument, typically options
     */
    init?: (url: string, trackingNumber: string) => Parameters<typeof fetch>[1];
  };
  /**
   * Should the response be parsed with `res.text()` or `res.json()`?
   * XML also gets parsed into a JS object
   */
  responseType: 'XML' | 'JSON';
};

export type ParseOptions = {
  /**
   * The path to the item in the response which represents the shipment.
   * e.g. for..
   *  - FedEx = TrackDetails
   *  - UPS = shipment[0] so [..., 'shipment', 0]
   *  - USPS = TrackInfo
   *
   * See usages
   */
  shipmentPath: (string | number)[];
  /**
   * A function which returns true if an error is detected in either the entire json response
   * or the shipment item (convenience).
   */
  checkForError: (response: any, shipment: any) => boolean;
  getTrackingEvents: (shipment: any) => TrackingEvent[];
  getEstimatedDeliveryTime?: (shipment: any) => number | undefined;
};

export type Courier<Name, Code> = {
  name: Name;
  code: Code;
  requiredEnvVars?: string[];
  fetchOptions: FetchOptions;
  parseOptions: ParseOptions;
  tsTrackingNumberCouriers: readonly TrackingCourier[];
};
