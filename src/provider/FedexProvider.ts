import * as codes from './codes.json';
import got from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import { TrackingEvent, TrackingInfo } from '../types';
import { ERR_RESPONSE_MISSING_TRACKING_DATA, ERR_TRACKING_NUMBER_NOT_FOUND } from './errors';
import {
  always,
  applySpec,
  complement,
  cond,
  either,
  filter,
  flatten,
  ifElse,
  isEmpty,
  isNil,
  join,
  map,
  partialRight,
  path,
  pathEq,
  pipe,
  prop,
  propOr,
  props,
  T,
  __
} from 'ramda';

interface Credentials {
  key: string;
  password: string;
  accountNumber: string;
  meterNumber: string;
}

const getDate: (event: any) => number = pipe<any, string, number>(
  prop('Timestamp'),
  ifElse(either(isNil, isEmpty), always(undefined), Date.parse)
);

const getLocation: (event: any) => string = pipe<any, any, string[], string[], string>(
  prop('Address'),
  props(['City', 'StateOrProvinceCode', 'CountryCode', 'PostalCode']),
  filter(complement(either(isNil, isEmpty))),
  ifElse(isEmpty, always(undefined), join(' '))
);

const getStatus: (event: any) => string = pipe<any, string, string>(
  prop('EventType'),
  propOr('UNAVAILABLE', __, codes.fedex)
);

const getTrackingEvent: (event: any) => TrackingEvent = applySpec<TrackingEvent>({
  status: getStatus,
  label: prop('EventDescription'),
  location: getLocation,
  date: getDate
});

const getTrackingEvents: (trackDetails: any) => TrackingEvent[] = pipe<
  any,
  string[],
  string[],
  TrackingEvent[]
>(prop('Events'), flatten, map(getTrackingEvent));

const parse: (response: any) => TrackingInfo = pipe<any, any, any, any, TrackingInfo>(
  prop('body'),
  partialRight(xmlToJson, [{ parseNodeValues: false }, undefined]),
  path([
    'SOAP-ENV:Envelope',
    'SOAP-ENV:Body',
    'TrackReply',
    'CompletedTrackDetails',
    'TrackDetails'
  ]),
  cond([
    [pathEq(['Notification', 'Severity'], 'ERROR'), always(ERR_TRACKING_NUMBER_NOT_FOUND)],
    [isNil, always(ERR_RESPONSE_MISSING_TRACKING_DATA)],
    [
      T,
      applySpec<TrackingInfo>({
        events: getTrackingEvents,
        estimatedDelivery: prop('EstimatedDeliveryTimestamp')
      })
    ]
  ])
);

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

const track = (trackingNumber: string, credentials: Credentials): Promise<TrackingInfo | Error> =>
  got('https://ws.fedex.com:443/web-services', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml'
    },
    body: createRequestXml(trackingNumber, credentials)
  }).then(parse);

export default track;
