import * as codes from './codes.json';
import got from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import TrackingInfo from '../TrackingInfo';

interface TrackDetails {
    EventType: string;
    EventDescription: any;
    Address: any;
    Timestamp: any;
}

interface Credentials {
    key: string;
    password: string;
    accountNumber: string;
    meterNumber: string;
}

const createRequestXml = (
    trackingNumber: string,
    { key, password, accountNumber, meterNumber }: Credentials
): string =>
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v9="http://fedex.com/ws/track/v9">
        <soapenv:Body>
        <TrackRequest xmlns="http://fedex.com/ws/track/v9">
        <WebAuthenticationDetail>
        <UserCredential>
        <Key>${key}</Key>
        <Password>${password}</Password>
        </UserCredential>
        </WebAuthenticationDetail>
        <ClientDetail>
        <AccountNumber>${accountNumber}</AccountNumber>
        <MeterNumber>${meterNumber}</MeterNumber>
        </ClientDetail>
        <Version>
        <ServiceId>trck</ServiceId>
        <Major>9</Major>
        <Intermediate>1</Intermediate>
        <Minor>0</Minor>
        </Version>
        <SelectionDetails>
        <PackageIdentifier>
        <Type>TRACKING_NUMBER_OR_DOORTAG</Type>
        <Value>${trackingNumber}</Value>
        </PackageIdentifier>
        </SelectionDetails>
        <ProcessingOptions>INCLUDE_DETAILED_SCANS</ProcessingOptions>
        </TrackRequest>
        </soapenv:Body>
        </soapenv:Envelope>`;

const getTrackingInfo = ({
    EventType,
    EventDescription,
    Address,
    Timestamp
}: TrackDetails) => ({
    status: codes.fedex[EventType],
    label: EventDescription,
    location:
        [
            Address.City,
            Address.StateOrProvinceCode,
            Address.CountryCode,
            Address.PostalCode
        ]
            .filter(Boolean)
            .join(' ') || undefined,
    date: new Date(Timestamp).getTime()
});

const parse = (response: any): TrackingInfo => ({
    events: [response.TrackReply.CompletedTrackDetails.TrackDetails.Events]
        .flat()
        .map(getTrackingInfo),
    estimatedDelivery:
        response.TrackReply.CompletedTrackDetails.TrackDetails
            .EstimatedDeliveryTimestamp
});

const track = async (
    trackingNumber: string,
    credentials: Credentials
): Promise<TrackingInfo> =>
    got('https://ws.fedex.com:443/web-services', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml'
        },
        body: createRequestXml(trackingNumber, credentials)
    }).then(res =>
        parse(
            xmlToJson(res.body, { parseNodeValue: false })['SOAP-ENV:Envelope'][
                'SOAP-ENV:Body'
            ]
        )
    );

export default track;
