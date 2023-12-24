import { DeepPartial, getLocation, reverseOneToManyDictionary } from './utils';
import {
  Courier,
  ParseOptions,
  FetchOptions,
  TrackingEvent,
  TrackingStatus,
} from '../types';
import { s10, usps } from 'ts-tracking-number';

// prettier-ignore
const statusCodes = reverseOneToManyDictionary({
  [TrackingStatus.LABEL_CREATED]: [
    'MA', 'GX',
  ],
  [TrackingStatus.OUT_FOR_DELIVERY]: [
    '59', 'DG', 'OF',
  ],
  [TrackingStatus.DELIVERY_ATTEMPTED]: [
    '02', '52', '51', '53', '54', '55', '56', '57', 'CA', 'CM',
    'H0', 'NH',
  ],
  [TrackingStatus.RETURNED_TO_SENDER]: [
    '09', '28', '29', '31', 'H8', '04', 'RD', 'RE', '05', '21',
    '22', '23', '24', '25', '26', '27', 'BA', 'K4', 'K5', 'K6',
    'K7', 'RT',
  ],
  [TrackingStatus.DELIVERED]: [
    '01', 'I0', 'BR', 'DN', 'AH', 'DL', 'OK', '60', '17',
  ],
} as const);

type TrackInfo = DeepPartial<{
  Event: string;
  EventCode: keyof typeof statusCodes;
  EventCity: string;
  EventState: string;
  EventCountry: string;
  EventZIPCode: string;
  EventDate: string;
  EventTime: string;
}>;

const getTime = ({
  date,
  time,
}: {
  date: string | undefined;
  time: string | undefined;
}): number | undefined =>
  date && time ? new Date(`${date} ${time}`).getTime() : undefined;

const getTrackingEvent = ({
  Event,
  EventCity,
  EventCode,
  EventCountry,
  EventDate,
  EventState,
  EventTime,
  EventZIPCode,
}: TrackInfo): TrackingEvent => ({
  status:
    (EventCode ? statusCodes[EventCode] : TrackingStatus.IN_TRANSIT) ||
    undefined,
  label: Event,
  location: getLocation({
    city: EventCity,
    state: EventState,
    country: EventCountry,
    zip: EventZIPCode,
  }),
  time: getTime({ date: EventDate, time: EventTime }),
});

const getTrackingEvents = (shipment: any): TrackingEvent[] =>
  shipment.TrackSummary.TrackDetail.flat().map(getTrackingEvent);

const getEstimatedDeliveryTime = (shipment: any): number =>
  shipment.ExpectedDeliveryDate;

const createRequestXml = (trackingNumber: string): string =>
  `<TrackFieldRequest USERID="${process.env.USPS_USER_ID}">
  <Revision>1</Revision>
  <ClientIp>127.0.0.1</ClientIp>
  <SourceId>1</SourceId>
  <TrackID ID="${trackingNumber}"/>
  </TrackFieldRequest>`;

const fetchOptions: FetchOptions = {
  devUrl: 'https://secure.shippingapis.com/ShippingAPI.dll',
  prodUrl: 'https://production.shippingapis.com/ShippingAPI.dll',
  parameters: {
    input: (url, trackingNumber) =>
      `${url}?API=TrackV2&XML=` + createRequestXml(trackingNumber),
  },
  responseType: 'XML',
};

const parseOptions: ParseOptions = {
  shipmentPath: ['TrackResponse', 'TrackInfo'],
  checkForError: (response, trackInfo) => response.Error || trackInfo.Error,
  getTrackingEvents,
  getEstimatedDeliveryTime,
};

const USPS: Courier<'usps'> = {
  name: 'USPS',
  code: 'usps',
  requiredEnvVars: ['USPS_USER_ID'],
  fetchOptions,
  parseOptions,
  tsTrackingNumberCouriers: [s10, usps],
};

export default USPS;
