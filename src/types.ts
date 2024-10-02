import { TrackingCourier } from "ts-tracking-number";
import * as couriers from "./couriers";

export type Couriers = typeof couriers;

export enum TrackingStatus {
  LABEL_CREATED = "LABEL_CREATED",
  IN_TRANSIT = "IN_TRANSIT",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERY_ATTEMPTED = "DELIVERY_ATTEMPTED",
  RETURNED_TO_SENDER = "RETURNED_TO_SENDER",
  EXCEPTION = "EXCEPTION",
  DELIVERED = "DELIVERED",
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
  courierCode?: Couriers[keyof Couriers]["code"];

  /**
   * By default, `process.env.NODE_ENV` is used to determine whether to use courier's dev or prod env.
   * Explicitly define an environment to override this.
   */
  env?: "development" | "production";
};

export type FetchOptions = {
  urls: {
    dev: string;
    prod: string;
  };

  fetchTracking: (url: string, trackingNumber: string) => ReturnType<typeof fetch>;
};

export type ParseOptions = {
  /**
   * Retrieves the item which represents the shipment from the tracking response.
   */
  getShipment: (response: any) => any;

  /**
   * A function which returns true if an error is detected in either the entire json response
   * or the shipment item (convenience).
   */
  checkForError: (response: any, shipment: any) => boolean;

  getTrackingEvents: (shipment: any) => TrackingEvent[];

  getEstimatedDeliveryTime?: (shipment: any) => TrackingInfo["estimatedDeliveryTime"];
};

export type Courier<Name, Code> = {
  name: Name;

  code: Code;

  requiredEnvVars?: string[];

  fetchOptions: FetchOptions;

  parseOptions: ParseOptions;

  tsTrackingNumberCouriers: readonly TrackingCourier[];
};
