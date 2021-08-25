export type TrackingEvent = {
  status?: string;
  label?: string;
  location?: string;
  time?: number;
};

export type TrackingInfo = {
  events: TrackingEvent[];
  estimatedDelivery?: number;
};