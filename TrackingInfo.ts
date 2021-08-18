export default interface TrackingInfo {
    events: {
        status?: string;
        label?: string;
        location?: string;
        time?: number;
    }[];
    estimatedDelivery?: number;
}
