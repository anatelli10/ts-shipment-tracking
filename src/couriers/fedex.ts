import * as codes from '../util/codes.json';
import got from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import { TrackingEvent, TrackingInfo, TrackingOptions } from '../util/types';
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
  __
} from 'ramda';
import { fedex, getTracking } from 'ts-tracking-number';

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

// todo: type
const parse = (response: any): TrackingInfo => {
  const { body } = response;

  const json = xmlToJson(body, { parseNodeValue: false });

  // todo: type
  const trackDetails: any = path(
    ['SOAP-ENV:Envelope', 'SOAP-ENV:Body', 'TrackReply', 'CompletedTrackDetails', 'TrackDetails'],
    json
  );

  if (trackDetails == null || 'ERROR' === path(['Notification', 'Severity'], trackDetails)) {
    throw new Error(`Error retrieving FedEx tracking.
    
    TrackDetails: 
    ${JSON.stringify(trackDetails)}
    
    Full response body:
    ${JSON.stringify(body)}
    `);
  }

  const events = getTrackingEvents(trackDetails);
  const estimatedDeliveryDate = trackDetails.EstimatedDeliveryTimestamp;

  return {
    events,
    estimatedDeliveryDate
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

export const trackFedex = async (
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  ['FEDEX_KEY', 'FEDEX_PASSWORD', 'FEDEX_ACCOUNT_NUMBER', 'FEDEX_METER_NUMBER'].forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Environment variable ${key} must be set in order to use FedEx tracking.`);
    }
  });

  const tracking = getTracking(trackingNumber, [fedex]);

  if (options?.bypassValidation !== true && !tracking) {
    throw new Error(`"${trackingNumber}" is not a valid FedEx tracking number.`);
  }

  const get = await got('https://ws.fedex.com:443/web-services', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml'
    },
    body: createRequestXml(trackingNumber)
  });

  const parsed = parse(get);

  return parsed;
};
