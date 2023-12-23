import * as codes from '../util/codes.json';
import got from 'got';
import { parse as xmlToJson } from 'fast-xml-parser';
import { TrackingEvent, TrackingInfo, TrackingOptions } from '../util/types';
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
  __
} from 'ramda';
import { getTracking, s10, usps } from 'ts-tracking-number';

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

// todo: type
const parse = (response: any) => {
  const { body } = response;

  const json = xmlToJson(body, { parseNodeValue: false });

  // todo: type
  const trackInfo: any = path(['TrackResponse', 'TrackInfo'], json);

  if (trackInfo == null || json.Error || trackInfo.Error) {
    throw new Error(`Error retrieving USPS tracking.

    TrackInfo:
    ${JSON.stringify(trackInfo)}

    Full response body:
    ${JSON.stringify(body)}
    `);
  }

  const events = getTrackingEvents(trackInfo);
  const estimatedDeliveryDate = getEstimatedDeliveryDate(trackInfo);

  console.log('events', events);

  return {
    events,
    estimatedDeliveryDate
  };
};

const createRequestXml = (trackingNumber: string): string =>
  `<TrackFieldRequest USERID="${process.env.USPS_USER_ID}">
  <Revision>1</Revision>
  <ClientIp>127.0.0.1</ClientIp>
  <SourceId>1</SourceId>
  <TrackID ID="${trackingNumber}"/>
  </TrackFieldRequest>`;

export const trackUsps = async (
  trackingNumber: string,
  options?: TrackingOptions
): Promise<TrackingInfo> => {
  ['USPS_USER_ID'].forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Environment variable ${key} must be set in order to use USPS tracking.`);
    }
  });

  const tracking = getTracking(trackingNumber, [usps, s10]);

  if (options?.bypassValidation !== true && !tracking) {
    throw new Error(`"${trackingNumber}" is not a valid USPS tracking number.`);
  }

  const get = await got(
    'https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=' +
      createRequestXml(trackingNumber)
  );

  const parsed = parse(get);

  return parsed;
};
