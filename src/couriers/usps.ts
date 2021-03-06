import * as codes from '../util/codes.json';
import got from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import { TrackingEvent, TrackingInfo } from '../util/types';
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
  partialRight,
  path,
  pipe,
  prop,
  propOr,
  props,
  unless,
  __
} from 'ramda';

const getDate: (event: any) => number = pipe<any, string[], string[], number>(
  props(['EventDate', 'EventTime']),
  filter(complement(isEmpty)),
  ifElse(isEmpty, always(undefined), pipe<string[], string, number>(join(' '), Date.parse))
);

const getLocation: (event: any) => string = pipe<any, string[], string[], string>(
  props(['EventCity', 'EventState', 'EventCountry', 'EventZIPCode']),
  filter(complement(either(isNil, isEmpty))),
  ifElse(isEmpty, always(undefined), join(' '))
);

const getStatus: (event: any) => string = pipe<any, string, string>(
  prop('EventCode'),
  propOr('IN_TRANSIT', __, codes.usps)
);

const getTrackingEvent: (event: any) => TrackingEvent = applySpec<TrackingEvent>({
  status: getStatus,
  label: prop('Event'),
  location: getLocation,
  date: getDate
});

const getTrackingEvents: (trackInfo: any) => TrackingEvent[] = pipe<
  any,
  string[],
  string[],
  TrackingEvent[]
>(props(['TrackSummary', 'TrackDetail']), flatten, map(getTrackingEvent));

const getEstimatedDeliveryDate: (trackInfo: any) => number = pipe<any, string, number>(
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

const parse: (response: any) => TrackingInfo | undefined = pipe<
  any,
  any,
  any,
  any,
  TrackingInfo | undefined
>(
  prop('body'),
  partialRight(xmlToJson, [{ parseNodeValue: false }, undefined]),
  path(['TrackResponse', 'TrackInfo']),
  ifElse(
    either(isNil, prop('Error')),
    always(undefined),
    applySpec<TrackingInfo>({
      events: getTrackingEvents,
      estimatedDeliveryDate: getEstimatedDeliveryDate
    })
  )
);

const createRequestXml = (trackingNumber: string): string =>
  `<TrackFieldRequest USERID="${process.env.USPS_USER_ID}">
  <Revision>1</Revision>
  <ClientIp>127.0.0.1</ClientIp>
  <SourceId>1</SourceId>
  <TrackID ID="${trackingNumber}"/>
  </TrackFieldRequest>`;

export const trackUsps = (trackingNumber: string): Promise<TrackingInfo | undefined> =>
  got(
    'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=' +
      createRequestXml(trackingNumber)
  )
    .then(parse)
    .catch((e) => undefined);
