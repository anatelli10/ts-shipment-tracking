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
$ npm install delivery-tracker
```

## Usage

Input:

```typescript
import { trackFedex, trackUps, trackUsps } from '.';

(async (): Promise<void> => {
    try {
        const fedex = await trackFedex('<fedex-tracking-number>', {
            key: '<fedex-key>',
            password: '<fedex-password>',
            accountNumber: '<fedex-account-number>',
            meterNumber: '<fedex-meter-number>'
        });
        console.log(fedex);

        const ups = await trackUps('<ups-tracking-number>', {
            accessLicenseNumber: '<ups-access-license-number>'
        });
        console.log(ups);

        const usps = await trackUsps('<usps-tracking-number>', {
            userId: '<usps-user-id>'
        });
        console.log(usps);
    } catch (error) {
        console.log(error);
    }
})();
```

Output:

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
-   [Node.js](https://nodejs.org/)

## Acknowledgements

-   [Shipment Tracking](https://github.com/hautelook/shipment-tracking)
-   [date-fns](https://date-fns.org/)
-   [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
-   [got](https://github.com/sindresorhus/got)
