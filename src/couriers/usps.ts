import { reverseOneToManyDictionary } from './utils';
import {
  Courier,
  CourierCodeDictionary,
  ParseOptions,
  TrackingEvent,
} from '../types';
// prettier-ignore
import { add, always, applySpec, complement, either, filter, flatten, ifElse, isEmpty, isNil, join, map, pipe, prop, propOr, props, unless, __ } from 'ramda';
import { s10, usps } from 'ts-tracking-number';

// prettier-ignore
const codes = reverseOneToManyDictionary({
  LABEL_CREATED: [
    'MA', 'GX',
  ],
  OUT_FOR_DELIVERY: [
    '59', 'DG', 'OF',
  ],
  DELIVERY_ATTEMPTED: [
    '02', '52', '51', '53', '54', '55', '56', '57', 'CA', 'CM',
    'H0', 'NH',
  ],
  RETURNED_TO_SENDER: [
    '09', '28', '29', '31', 'H8', '04', 'RD', 'RE', '05', '21',
    '22', '23', '24', '25', '26', '27', 'BA', 'K4', 'K5', 'K6', 'K7', 'RT',
  ],
  DELIVERED: [
    '01', 'I0', 'BR', 'DN', 'AH', 'DL', 'OK', '60', '17',
  ],
} as const as CourierCodeDictionary);

const getDate: (event: any) => number = pipe<any, string[], string[], number>(
  props(['EventDate', 'EventTime']),
  filter(complement(isEmpty)),
  ifElse(
    isEmpty,
    always(undefined),
    pipe<string[], string, number>(join(' '), Date.parse)
  )
);

const getLocation: (event: any) => string = pipe<
  any,
  string[],
  string[],
  string
>(
  props(['EventCity', 'EventState', 'EventCountry', 'EventZIPCode']),
  filter(complement(either(isNil, isEmpty))),
  ifElse(isEmpty, always(undefined), join(' '))
);

const getStatus: (event: any) => string = pipe<any, string, string>(
  prop('EventCode'),
  propOr('IN_TRANSIT', __, codes)
);

const getTrackingEvent: (event: any) => TrackingEvent =
  applySpec<TrackingEvent>({
    status: getStatus,
    label: prop('Event'),
    location: getLocation,
    date: getDate,
  });

const getTrackingEvents: (trackInfo: any) => TrackingEvent[] = pipe<
  any,
  string[],
  string[],
  TrackingEvent[]
>(props(['TrackSummary', 'TrackDetail']), flatten, map(getTrackingEvent));

const getEstimatedDeliveryDate: (trackInfo: any) => number = pipe<
  any,
  string,
  number
>(
  prop('ExpectedDeliveryDate'),
  unless(
    isNil,
    pipe<string, number, number>(
      Date.parse,
      // convert 12 AM to 9 PM
      add((12 + 9) * 60 * 60 * 1000)
    )
  )
);

const createRequestXml = (trackingNumber: string): string =>
  `<TrackFieldRequest USERID="${process.env.USPS_USER_ID}">
  <Revision>1</Revision>
  <ClientIp>127.0.0.1</ClientIp>
  <SourceId>1</SourceId>
  <TrackID ID="${trackingNumber}"/>
  </TrackFieldRequest>`;

const parseOptions: ParseOptions = {
  isXML: true,
  shipmentItemPath: ['TrackResponse', 'TrackInfo'],
  checkForError: (json, trackInfo) => json.Error || trackInfo.Error,
  getTrackingEvents,
  getEstimatedDeliveryDate,
};

const request = (trackingNumber: string) =>
  fetch(
    // production.shippingapis for prod??
    'https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=' +
      createRequestXml(trackingNumber)
  ).then((res) => res.text());

const USPS: Courier<'usps'> = {
  name: 'USPS',
  code: 'usps',
  requiredEnvVars: ['USPS_USER_ID'],
  request,
  parseOptions,
  tsTrackingNumberCouriers: [s10, usps],
};

export default USPS;
