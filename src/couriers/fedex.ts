import { reverseOneToManyDictionary } from './utils';
import {
  Courier,
  TrackingCodeDictionary,
  ParseOptions,
  TrackingEvent,
} from '../types';
// prettier-ignore
import { always, applySpec, complement, either, filter, flatten, ifElse, isEmpty, isNil, join, map, path, pipe, prop, propOr, props, __ } from 'ramda';
import { fedex } from 'ts-tracking-number';

// prettier-ignore
const codes = reverseOneToManyDictionary({
  LABEL_CREATED: [
    'PU', 'PX', 'OC',
  ],
  IN_TRANSIT: [
    'AA', 'AC', 'AD', 'AF', 'AP', 'AR', 'AX', 'CH', 'DD', 'DP',
    'DR', 'DS', 'DY', 'EA', 'ED', 'EO', 'EP', 'FD', 'HL', 'IT',
    'IX', 'LO', 'PF', 'PL', 'PM', 'RR', 'RM', 'RC', 'SF', 'SP',
    'TR', 'CC', 'CD', 'CP', 'OF', 'OX', 'PD', 'SH', 'CU', 'BR',
    'TP',
  ],
  OUT_FOR_DELIVERY: [
    'OD',
  ],
  RETURNED_TO_SENDER: [
    'RS', 'RP', 'LP', 'RG', 'RD',
  ],
  EXCEPTION: [
    'CA', 'DE', 'SE',
  ],
  DELIVERED: [
    'DL',
  ],
} as const as TrackingCodeDictionary);

const getDate: (event: any) => number = pipe<any, string, number>(
  prop('Timestamp'),
  ifElse(either(isNil, isEmpty), always(undefined), Date.parse)
);

const getLocation: (event: any) => string = pipe<
  any,
  any,
  string[],
  string[],
  string
>(
  prop('Address'),
  props(['City', 'StateOrProvinceCode', 'CountryCode', 'PostalCode']),
  filter(complement(either(isNil, isEmpty))),
  ifElse(isEmpty, always(undefined), join(' '))
);

const getStatus: (event: any) => string = pipe<any, string, string>(
  prop('EventType'),
  propOr('UNAVAILABLE', __, codes)
);

const getTrackingEvent: (event: any) => TrackingEvent =
  applySpec<TrackingEvent>({
    status: getStatus,
    label: prop('EventDescription'),
    location: getLocation,
    date: getDate,
  });

const getTrackingEvents: (trackDetails: any) => TrackingEvent[] = pipe<
  any,
  string[],
  string[],
  TrackingEvent[]
>(prop('Events'), flatten, map(getTrackingEvent));

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
  shipmentItemPath: [
    'SOAP-ENV:Envelope',
    'SOAP-ENV:Body',
    'TrackReply',
    'CompletedTrackDetails',
    'TrackDetails',
  ],
  checkForError: (_, trackDetails) =>
    'ERROR' === path(['Notification', 'Severity'], trackDetails),
  getTrackingEvents,
  getEstimatedDeliveryDate: (trackDetails) =>
    trackDetails.EstimatedDeliveryTimestamp,
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
