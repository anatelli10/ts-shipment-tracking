export type TrackingEvent = {
  status?: string;
  label?: string;
  location?: string;
  date?: number;
};

export type TrackingInfo = {
  events: TrackingEvent[];
  estimatedDeliveryDate?: number;
};