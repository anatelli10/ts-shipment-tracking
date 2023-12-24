import * as codes from '../codes.json';
import { Courier, TrackingEvent } from '../types';
import { parser } from '../utils';
import {
  add,
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
  unless,
  __,
} from 'ramda';
import { s10, usps } from 'ts-tracking-number';

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
  propOr('IN_TRANSIT', __, codes.usps)
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

const parse = (response: any) => {
  const json = parser.parse(response);

  const trackInfo: any = path(['TrackResponse', 'TrackInfo'], json);

  if (trackInfo == null || json.Error || trackInfo.Error) {
    throw new Error(`Error retrieving USPS tracking.

    TrackInfo:
    ${JSON.stringify(trackInfo)}

    Full response body:
    ${JSON.stringify(response)}
    `);
  }

  const events = getTrackingEvents(trackInfo);
  const estimatedDeliveryDate = getEstimatedDeliveryDate(trackInfo);

  return {
    events,
    estimatedDeliveryDate,
  };
};

const createRequestXml = (trackingNumber: string): string =>
  `<TrackFieldRequest USERID="${process.env.USPS_USER_ID}">
  <Revision>1</Revision>
  <ClientIp>127.0.0.1</ClientIp>
  <SourceId>1</SourceId>
  <TrackID ID="${trackingNumber}"/>
  </TrackFieldRequest>`;

const USPS: Courier<'usps'> = {
  name: 'USPS',
  code: 'usps',
  requiredEnvVars: ['USPS_USER_ID'],
  request: (trackingNumber: string) =>
    fetch(
      'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=' +
        createRequestXml(trackingNumber)
    ).then((res) => res.text()),
  parse,
  tsTrackingNumberCouriers: [s10, usps],
};

export default USPS;
