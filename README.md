<p align="center">
  <h3 align="center">ts-shipment-tracking</h3>

  <p align="center">
    Unified shipment tracking data from FedEx, UPS, and USPS APIs.
  </p>
</p>

## About

Returns a unified response from FedEx, UPS, and USPS tracking APIs.

FedEx API version: Track API 1.0.0 (https://apis.fedex.com/track/v1)
UPS API version: --
USPS API version: Package Tracking and Notification 3.2.1 (https://api.usps.com/tracking/v3/tracking)

## Installation

```sh
$ npm install ts-shipment-tracking
```

## Usage

Courier API credentials are stored using dotenv. If you do not have dotenv installed:

```sh
$ npm install dotenv
```

Copy the contents of [.env.template](.env.template) into your `.env` file and fill it out.

Example input:

```ts
import "dotenv/config";
import { track, TrackingInfo } from "ts-shipment-tracking";

(async () => {
  // With automatic courier detection
  try {
    const tragnostic: TrackingInfo = await track("<any_tracking_number>");

    console.log(tragnostic);
  } catch (err) {
    console.log((err as Error).message);
  }

  // With explicitly specified courier
  try {
    const tracking: TrackingInfo = await track(
      "<ups_tracking_number>",
      // Supports autocomplete!
      { courierCode: "ups" }
    );

    console.log(tracking);
  } catch (err) {
    console.log((err as Error).message);
  }
})();
```

Example output:

```json
{
  events: [
    {
      status: 'IN_TRANSIT',
      label: 'Arrived at FedEx location',
      location: 'LEBANON TN US 37090',
      time: 1616823540000
    },
    ...
  ],
  estimatedDeliveryTime: 1616996340000
}
```

All statuses:

```ts
export enum TrackingStatus {
  LABEL_CREATED = "LABEL_CREATED",
  IN_TRANSIT = "IN_TRANSIT",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERY_ATTEMPTED = "DELIVERY_ATTEMPTED",
  RETURNED_TO_SENDER = "RETURNED_TO_SENDER",
  EXCEPTION = "EXCEPTION",
  DELIVERED = "DELIVERED",
}
```

## Acknowledgements

Thanks to @rjbrooksjr's [TS Tracking Number](https://github.com/rjbrooksjr/ts-tracking-number) module being used for tracking number courier detection.

Thanks to @hautelook's [Shipment Tracking](https://github.com/hautelook/shipment-tracking) repo used as a reference for some gaps in courier status codes as well as inspiration for architecture.
