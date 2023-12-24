import { TrackingCourier } from 'ts-tracking-number';
import * as couriers from './couriers';

export type Couriers = typeof couriers;

export type TrackingStatus =
  | 'UNAVAILABLE'
  | 'LABEL_CREATED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPTED'
  | 'RETURNED_TO_SENDER'
  | 'EXCEPTION'
  | 'DELIVERED';

export type StatusCodeDictionary = Partial<
  Readonly<Record<TrackingStatus, readonly string[]>>
>;

export type TrackingEvent = {
  status?: TrackingStatus;
  label?: string;
  location?: string;
  date?: number;
};

export type TrackingInfo = {
  events: TrackingEvent[];
  estimatedDeliveryDate?: number;
};

export type TrackingOptions = {
  /**
   * Explicitly define a courier code to bypass auto-detection
   */
  courierCode?: Couriers[keyof Couriers]['code'];
};

export type ParseOptions = {
  /**
   * !!!IMPORTANT!!!
   * This flag must be enabled to automatically parse XML responses.
   */
  isXML?: boolean;
  /**
   * The path to the item in the response which represents the shipment.
   * e.g. for..
   *  - FedEx = TrackDetails
   *  - UPS = shipment[0] so [..., 'shipment', 0]
   *  - USPS = TrackInfo
   *
   * See usages
   */
  shipmentItemPath: (string | number)[];
  /**
   * A function which returns true if an error is detected in either the entire json response
   * or the shipment item (convenience).
   */
  checkForError: (json: any, shipment: any) => boolean;
  getTrackingEvents: (shipment: any) => TrackingEvent[];
  getEstimatedDeliveryDate?: (shipment: any) => number | undefined;
};

export type Courier<Code> = {
  name: string;
  code: Code;
  requiredEnvVars?: string[];
  /**
   * Makes an API request for the given tracking number
   * Must return either JSON or an XML string
   */
  request: (trackingNumber: string) => Promise<any | string>;
  parseOptions: ParseOptions;
  tsTrackingNumberCouriers: readonly TrackingCourier[];
};
