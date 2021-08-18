import * as codes from './codes.json';
import got from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import TrackingInfo from '../TrackingInfo';

interface TrackDetails {
    Event: string;
    EventCode: string;
    EventCity: string;
    EventState: string;
    EventCountry: string;
    EventZIPCode: string;
    EventDate: string;
    EventTime: string;
}

interface Credentials {
    userId: string;
}

const createRequestXml = (
    trackingNumber: string,
    { userId }: Credentials
): string =>
    `<TrackFieldRequest USERID="${userId}">
    <Revision>1</Revision>
    <ClientIp>127.0.0.1</ClientIp>
    <SourceId>1</SourceId>
    <TrackID ID="${trackingNumber}"/>
    </TrackFieldRequest>`;

const getTrackingInfo = ({
    Event,
    EventCode,
    EventCity,
    EventState,
    EventCountry,
    EventZIPCode,
    EventDate,
    EventTime
}: TrackDetails) => ({
    status: codes.usps[EventCode] ?? 'IN_TRANSIT',
    label: Event,
    location:
        [EventCity, EventState, EventCountry, EventZIPCode]
            .filter(Boolean)
            .join(' ') || undefined,
    date: new Date(`${EventDate} ${EventTime}`).getTime()
});

const parse = (response: any): TrackingInfo => ({
    events: [
        response.TrackResponse.TrackInfo.TrackSummary,
        ...([response.TrackResponse.TrackInfo.TrackDetail].flat() ?? [])
    ].map(getTrackingInfo),
    estimatedDelivery: response.TrackResponse.TrackInfo.ExpectedDeliveryDate
});

const track = async (
    trackingNumber: string,
    credentials: Credentials
): Promise<TrackingInfo> =>
    got(
        'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=' +
            createRequestXml(trackingNumber, credentials),
        {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml'
            },
            body: createRequestXml(trackingNumber, credentials)
        }
    ).then(res => parse(xmlToJson(res.body, { parseNodeValue: false })));

export default track;
