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
    <li><a href="#built-with">Built With</a></li>
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
import { TrackingInfo, track, trackByCourier, trackFedex } from 'ts-shipment-tracking';

(async () => {
  const tragnostic: TrackingInfo = await track('<any_tracking_number>');
  console.log(tragnostic);

  // or

  const withSpecifiedCourierCode: TrackingInfo = await trackByCourier('ups', '<ups_tracking_number>');
  console.log(withSpecifiedCourier);

  // or

  const withCourierFunction: TrackingInfo = await trackFedex('<fedex_tracking_number>');
  console.log(withCourierFunction);
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
      date: 1616823540000
    },
    ...
  ],
  estimatedDeliveryDate: 1616996340000
}
```

Statuses:

```
'UNAVAILABLE'
'LABEL_CREATED'
'IN_TRANSIT'
'OUT_FOR_DELIVERY'
'DELIVERY_ATTEMPTED'
'RETURNED_TO_SENDER'
'EXCEPTION'
'DELIVERED'
```

## Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Ramda](https://ramdajs.com/)
- [Node.js](https://nodejs.org/)

## Acknowledgements

- [TS Tracking Number](https://github.com/rjbrooksjr/ts-tracking-number)
- [Shipment Tracking](https://github.com/hautelook/shipment-tracking)
- [date-fns](https://date-fns.org/)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- [got](https://github.com/sindresorhus/got)

