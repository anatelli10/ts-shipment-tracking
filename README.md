<p align="center">
  <h3 align="center">ts-shipment-tracking</h3>

  <p align="center">
    Unified shipment tracking data from FedEx, UPS, and USPS APIs.
  </p>
</p>

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about">About</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

## About

Returns a unified response from FedEx, UPS, and USPS tracking APIs.

## Installation

```sh
$ npm install ts-shipment-tracking
```

## Usage

Courier API credentials are stored using dotenv. If you do not have dotenv installed:

```sh
$ npm install dotenv
```

Add the following credentials to your `.env` file:

```
FEDEX_KEY=
FEDEX_PASSWORD=
FEDEX_ACCOUNT_NUMBER=
FEDEX_METER_NUMBER=
UPS_ACCESS_LICENSE_NUMBER=
USPS_USER_ID=
```

Example input:

```typescript
import 'dotenv/config';
import {
  TrackingInfo,
  track,
  trackByCourier,
  trackFedex,
} from 'ts-shipment-tracking';

(async () => {
  try {
    const tragnostic: TrackingInfo = await track('<any_tracking_number>');

    console.log(tragnostic);
  } catch (err) {
    console.log(err);
  }

  // or

  try {
    const withSpecifiedCourierCode: TrackingInfo = await track(
      '<ups_tracking_number>',
      { courierCode: 'ups' }
    );

    console.log(withSpecifiedCourierCode);
  } catch (err) {
    console.log(err);
  }
})();
```

Example output:

```typescript
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

```typescript
// src/types.ts
export enum TrackingStatus {
  LABEL_CREATED = 'LABEL_CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERY_ATTEMPTED = 'DELIVERY_ATTEMPTED',
  RETURNED_TO_SENDER = 'RETURNED_TO_SENDER',
  EXCEPTION = 'EXCEPTION',
  DELIVERED = 'DELIVERED',
}
```

## Acknowledgements

- [TS Tracking Number](https://github.com/rjbrooksjr/ts-tracking-number)
- [Shipment Tracking](https://github.com/hautelook/shipment-tracking)
- [date-fns](https://date-fns.org/)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- [got](https://github.com/sindresorhus/got)
