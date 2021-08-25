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

Create a ```credentials.json``` file with the following structure:
```json
{
  "fedex": {
    "key": "",
    "password": "",
    "accountNumber": "",
    "meterNumber": ""
  },

  "ups": {
    "accessLicenseNumber": ""
  },

  "usps": {
    "userId": ""
  }
}
```

Install rjbrooksjr's [ts-tracking-number](https://github.com/rjbrooksjr/ts-tracking-number) (recommended in order to use below implementation, but not required):

```sh
$ npm install ts-tracking-number
```

Example input:

```typescript
import * as credentials from './credentials.json';
import { TrackingInfo, trackFedex, trackUps, trackUsps } from 'ts-shipment-tracking';
import { getTracking, fedex, ups, usps, s10 } from 'ts-tracking-number';

const trackByCourier = (
  courierCode: string,
  trackingNumber: string
): Promise<TrackingInfo | Error> =>
  courierCode === 'fedex'
    ? trackFedex(trackingNumber, credentials.fedex)
    : courierCode === 'ups'
    ? trackUps(trackingNumber, credentials.ups)
    : trackUsps(trackingNumber, credentials.usps);

const track = (trackingNumber: string): Promise<TrackingInfo | Error> =>
  trackByCourier(
    getTracking(trackingNumber, [fedex, ups, usps, s10])?.courier.code ?? '',
    trackingNumber
  );

(async () => {
  try {
    const trackInfo = await track('<any_tracking_number_here>');
    console.log('trackInfo:', trackInfo);
  } catch (error) {
    console.log(error);
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
      date: 1616823540000
    },
    ...
  ],
  estimatedDelivery: 1616996340000
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

-   [TypeScript](https://www.typescriptlang.org/)
-   [Ramda](https://ramdajs.com/)
-   [Node.js](https://nodejs.org/)

## Acknowledgements

-   [Shipment Tracking](https://github.com/hautelook/shipment-tracking)
-   [TS Tracking Number](https://github.com/rjbrooksjr/ts-tracking-number)
-   [date-fns](https://date-fns.org/)
-   [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
-   [got](https://github.com/sindresorhus/got)
