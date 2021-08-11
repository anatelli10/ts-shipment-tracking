<p align="center">
  <h3 align="center">package-tracking</h3>

  <p align="center">
    Retrieves package tracking data using FedEx, UPS, and USPS APIs.
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about">About</a>
      <ul>
        <li><a href="#usage">Usage</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About

Returns the last package tracking event for a given package tracking number. Can be easily modified to return all tracking events and or additional information like location. The structure is heavily inspired by the PHP tracking repo [Shipment Tracking](https://github.com/hautelook/shipment-tracking). Integrates with [TS Tracking Number](https://github.com/rjbrooksjr/ts-tracking-number) for courier info and validation.

### Usage

Populate the **credentials.json** file in the root of the project with your courier API credentials. **Add credentials.json to .gitignore if you are using git with this project**.

See **test.ts** for example usage (you must input the courierCode and trackingNumber).

Input:
```typescript
import { track } from './index';

(async (): Promise<void> => {
    const info = await track('usps', '<usps tracking number here>');
    console.log(info);
})();
```

Output:
```typescript
PackageInfo {
  status: 7,
  label: 'Delivered, In/At Mailbox',
  deliveryTime: 1626372300000
}
```

Status enum:
```typescript
enum PackageStatus {
    UNAVAILABLE,
    LABEL_CREATED,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERY_ATTEMPTED,
    RETURNED_TO_SENDER,
    EXCEPTION,
    DELIVERED
}
```

### Built With

-   [TypeScript](https://www.typescriptlang.org/)
-   [Node.js](https://nodejs.org/)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

-   [Shipment Tracking](https://github.com/hautelook/shipment-tracking)
-   [TS Tracking Number](https://github.com/rjbrooksjr/ts-tracking-number)
-   [date-fns](https://date-fns.org/)
-   [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
-   [got](https://github.com/sindresorhus/got)
-   [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
