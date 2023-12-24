import { DeepPartial, getLocation, reverseOneToManyDictionary } from './utils';
import { Courier, ParseOptions, TrackingEvent, TrackingStatus } from '../types';
import { fedex } from 'ts-tracking-number';

// prettier-ignore
const statusCodes = reverseOneToManyDictionary({
  [TrackingStatus.LABEL_CREATED]: [
    'PU', 'PX', 'OC',
  ],
  [TrackingStatus.IN_TRANSIT]: [
    'AA', 'AC', 'AD', 'AF', 'AP', 'AR', 'AX', 'CH', 'DD', 'DP',
    'DR', 'DS', 'DY', 'EA', 'ED', 'EO', 'EP', 'FD', 'HL', 'IT',
    'IX', 'LO', 'PF', 'PL', 'PM', 'RR', 'RM', 'RC', 'SF', 'SP',
    'TR', 'CC', 'CD', 'CP', 'OF', 'OX', 'PD', 'SH', 'CU', 'BR',
    'TP',
  ],
  [TrackingStatus.OUT_FOR_DELIVERY]: [
    'OD',
  ],
  [TrackingStatus.RETURNED_TO_SENDER]: [
    'RS', 'RP', 'LP', 'RG', 'RD',
  ],
  [TrackingStatus.EXCEPTION]: [
    'CA', 'DE', 'SE',
  ],
  [TrackingStatus.DELIVERED]: [
    'DL',
  ],
} as const);

type TrackDetails = DeepPartial<{
  EventType: keyof typeof statusCodes;
  EventDescription: string;
  Address: {
    City: string;
    StateOrProvinceCode: string;
    CountryCode: string;
    PostalCode: string;
  };
  Timestamp: string;
}>;

const getTrackingEvent = ({
  Address,
  EventDescription,
  EventType,
  Timestamp,
}: TrackDetails): TrackingEvent => ({
  status: (EventType && statusCodes[EventType]) || undefined,
  label: EventDescription,
  location: getLocation({
    city: Address?.City,
    state: Address?.StateOrProvinceCode,
    country: Address?.CountryCode,
    zip: Address?.PostalCode,
  }),
  time: Timestamp ? new Date(Timestamp).getTime() : undefined,
});

const getTrackingEvents = (shipment: any): TrackingEvent[] =>
  shipment.Events.flat().map(getTrackingEvent);

const createRequestXml = (trackingNumber: string): string =>
  `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v9="http://fedex.com/ws/track/v9">
  <soapenv:Body>
  <TrackRequest xmlns="http://fedex.com/ws/track/v9">
  <WebAuthenticationDetail>
  <UserCredential>
  <Key>${process.env.FEDEX_KEY}</Key>
  <Password>${process.env.FEDEX_PASSWORD}</Password>
  </UserCredential>
  </WebAuthenticationDetail>
  <ClientDetail>
  <AccountNumber>${process.env.FEDEX_ACCOUNT_NUMBER}</AccountNumber>
  <MeterNumber>${process.env.FEDEX_METER_NUMBER}</MeterNumber>
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

const parseOptions: ParseOptions = {
  isXML: true,
  shipmentPath: [
    'SOAP-ENV:Envelope',
    'SOAP-ENV:Body',
    'TrackReply',
    'CompletedTrackDetails',
    'TrackDetails',
  ],
  checkForError: (_, trackDetails) =>
    'ERROR' === trackDetails?.Notification?.Severity,
  getTrackingEvents,
  getEstimatedDeliveryTime: (shipment) => shipment.EstimatedDeliveryTimestamp,
};

const request = (trackingNumber: string) =>
  // ws.fedex for prod?
  fetch('https://wsbeta.fedex.com:443/web-services', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
    },
    body: createRequestXml(trackingNumber),
  }).then((res) => res.text());

const FedEx: Courier<'fedex'> = {
  name: 'FedEx',
  code: 'fedex',
  requiredEnvVars: [
    'FEDEX_KEY',
    'FEDEX_PASSWORD',
    'FEDEX_ACCOUNT_NUMBER',
    'FEDEX_METER_NUMBER',
  ],
  request,
  parseOptions,
  tsTrackingNumberCouriers: [fedex],
};

export default FedEx;
