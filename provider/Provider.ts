import got, { OptionsOfTextResponseBody } from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import PackageInfo from '../package/PackageInfo';
import ResponseType from './ResponseType';

export default abstract class Provider {
    async track(trackingNumber: string): Promise<PackageInfo> {
        try {
            var response = await got(
                this.getUrl(trackingNumber),
                this.getOptions(trackingNumber)
            );
        } catch {
            return new PackageInfo();
        }

        switch (this.getResponseType()) {
            case ResponseType.XML:
                response = xmlToJson(response.body, { parseNodeValue: false });
                break;
            case ResponseType.SOAP:
                response = xmlToJson(response.body, { parseNodeValue: false })[
                    'SOAP-ENV:Envelope'
                ]['SOAP-ENV:Body'];
                break;
            case ResponseType.JSON:
                response = JSON.parse(response.body);
                break;
        }

        return this.parse(response);
    }

    abstract getUrl(trackingNumber: string): string;

    abstract getOptions(
        trackingNumber: string
    ): OptionsOfTextResponseBody | undefined;

    abstract getResponseType(): ResponseType;

    abstract parse(response: any): PackageInfo;
}
