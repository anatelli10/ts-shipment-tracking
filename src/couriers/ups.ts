import { reverseOneToManyDictionary } from './utils';
import { Courier, ParseOptions, TrackingEvent, TrackingStatus } from '../types';
import { getTime, parse as dateParser } from 'date-fns';
// prettier-ignore
import { always, apply, applySpec, both, complement, compose, concat, converge, either, equals, filter, ifElse, includes, isEmpty, isNil, join, map, nthArg, path, pathEq, paths, pipe, prop, propOr, props, __ } from 'ramda';
import { ups } from 'ts-tracking-number';

// prettier-ignore
const codes = reverseOneToManyDictionary({
  [TrackingStatus.LABEL_CREATED]: [
    'M', 'P',
  ],
  [TrackingStatus.IN_TRANSIT]: [
    'I', 'DO', 'DD', 'W',
  ],
  [TrackingStatus.OUT_FOR_DELIVERY]: [
    'O',
  ],
  [TrackingStatus.RETURNED_TO_SENDER]: [
    'RS',
  ],
  [TrackingStatus.EXCEPTION]: [
    'MV', 'X', 'NA',
  ],
  [TrackingStatus.DELIVERED]: [
    'D',
  ],
} as const);

const getDate: (date: string, time: string) => number = pipe<any, Date, number>(
  converge(dateParser, [
    concat,
    converge(concat, [
      ifElse(nthArg(0), always('yyyyMMdd'), always('')),
      ifElse(nthArg(1), always('Hmmss'), always('')),
    ]),
    always(Date.now()),
  ]),
  getTime
);

const getLocation: (activity: any) => string = pipe<
  any,
  any,
  string[],
  string[],
  string
>(
  path(['location', 'address']),
  props(['city', 'stateProvince', 'countryCode', 'postalCode']),
  filter(complement(either(isNil, isEmpty))),
  ifElse(isEmpty, always(undefined), join(' '))
);

const getStatus: (activity: any) => string = pipe<any, any, string>(
  path(['status']),
  ifElse(
    both(
      equals('EXCEPTION'),
      compose(includes('DELIVERY ATTEMPT'), prop('description'))
    ),
    always(TrackingStatus.DELIVERY_ATTEMPTED),
    pipe<any, string, string>(
      prop('type'),
      propOr(TrackingStatus.UNAVAILABLE, __, codes)
    )
  )
);

const getTrackingEvent: (activity: any) => TrackingEvent =
  applySpec<TrackingEvent>({
    status: getStatus,
    label: path(['status', 'description']),
    location: getLocation,
    date: pipe(props(['date', 'time']), apply(getDate)),
  });

const getTrackingEvents: (packageDetails: any) => TrackingEvent[] = pipe<
  any,
  any,
  TrackingEvent[]
>(prop('activity'), map(getTrackingEvent));

const getEstimatedDeliveryDate: (packageDetails: any) => number = ifElse(
  pathEq(['deliveryTime', 'type'], 'EDW'),
  pipe(
    paths([
      ['deliveryDate', '0', 'date'],
      ['deliveryTime', 'endTime'],
    ]),
    apply(getDate)
  ),
  always(undefined)
);

const parseOptions: ParseOptions = {
  shipmentItemPath: ['trackResponse', 'shipment', '0', 'package', 0],
  checkForError: (json) =>
    'Tracking Information Not Found' ===
    path(['trackResponse', 'shipment', '0', 'warnings', '0', 'message'], json),
  getTrackingEvents,
  getEstimatedDeliveryDate,
};

const request = (trackingNumber: string) =>
  fetch('https://onlinetools.ups.com/track/v1/details/' + trackingNumber).then(
    (res) => res.json()
  );

const UPS: Courier<'ups'> = {
  name: 'UPS',
  code: 'ups',
  requiredEnvVars: ['UPS_ACCESS_LICENSE_NUMBER'],
  request,
  parseOptions,
  tsTrackingNumberCouriers: [ups],
};

export default UPS;
