import * as codes from '../codes.json';
import { Courier, TrackingEvent, TrackingInfo } from '../types';
import { parser } from '../utils';
import {
  always,
  applySpec,
  complement,
  either,
  filter,
  flatten,
  ifElse,
  isEmpty,
  isNil,
  join,
  map,
  path,
  pipe,
  prop,
  propOr,
  props,
  __,
} from 'ramda';
import { fedex } from 'ts-tracking-number';

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
  propOr('UNAVAILABLE', __, codes.fedex)
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

const parse = (response: any): TrackingInfo => {
  const json = parser.parse(response);

  const trackDetails: any = path(
    [
      'SOAP-ENV:Envelope',
      'SOAP-ENV:Body',
      'TrackReply',
      'CompletedTrackDetails',
      'TrackDetails',
    ],
    json
  );

  if (
    trackDetails == null ||
    'ERROR' === path(['Notification', 'Severity'], trackDetails)
  ) {
    throw new Error(`Error retrieving FedEx tracking.
    
    TrackDetails: 
    ${JSON.stringify(trackDetails)}
    
    Full response body:
    ${JSON.stringify(response)}
    `);
  }

  const events = getTrackingEvents(trackDetails);
  const estimatedDeliveryDate = trackDetails.EstimatedDeliveryTimestamp;

  return {
    events,
    estimatedDeliveryDate,
  };
};

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

const FedEx: Courier<'fedex'> = {
  name: 'FedEx',
  code: 'fedex',
  requiredEnvVars: [
    'FEDEX_KEY',
    'FEDEX_PASSWORD',
    'FEDEX_ACCOUNT_NUMBER',
    'FEDEX_METER_NUMBER',
  ],
  request: (trackingNumber: string) =>
    // ws.fedex (without beta) for prod?
    fetch('https://wsbeta.fedex.com:443/web-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
      },
      body: createRequestXml(trackingNumber),
    }).then((res) => res.text()),
  parse,
  tsTrackingNumberCouriers: [fedex],
};

export default FedEx;
