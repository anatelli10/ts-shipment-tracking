import { parse as dateParser } from 'date-fns';
import { OptionsOfTextResponseBody } from 'got';
import Provider from './Provider';
import ResponseType from './ResponseType';
import PackageInfo from '../package/PackageInfo';
import PackageStatus from '../package/PackageStatus';
import codes from './statusCode/upsStatusCode';

export default class UpsProvider extends Provider {
    accessLicenseNumber: string;

    constructor(accessLicenseNumber: string) {
        super();
        this.accessLicenseNumber = accessLicenseNumber;
    }

    getUrl(trackingNumber: string) {
        return `https://onlinetools.ups.com/track/v1/details/${trackingNumber}`;
    }

    getOptions(): OptionsOfTextResponseBody {
        return {
            headers: {
                AccessLicenseNumber: this.accessLicenseNumber,
                Accept: 'application/json'
            }
        };
    }

    getResponseType() {
        return ResponseType.JSON;
    }

    parse(response: any) {
        if (
            response.errors ||
            response.trackResponse.shipment[0].warnings ||
            !response.trackResponse.shipment[0].package
        )
            return new PackageInfo();

        const pkg = response.trackResponse.shipment[0].package[0];
        const lastEvent = pkg.activity[0];
        const date = pkg.deliveryDate && pkg.deliveryDate[0].date;
        const time = pkg.deliveryTime?.endTime;

        const label = lastEvent.status.description;

        const statusCode = lastEvent.status.type;
        let status = codes.get(statusCode);
        if (
            status === PackageStatus.EXCEPTION &&
            label.includes('DELIVERY ATTEMPT')
        )
            status = PackageStatus.DELIVERY_ATTEMPTED;

        const deliveryTime =
            date || time
                ? dateParser(
                      `${date ?? ``}${time ?? ``}`,
                      `${date ? `yyyyMMdd` : ``}${time ? `Hmmss` : ``}`,
                      new Date()
                  ).getTime()
                : undefined;

        return new PackageInfo(status, label, deliveryTime);
    }
}
