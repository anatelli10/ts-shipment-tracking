import { DeepPartial, getLocation, reverseOneToManyDictionary } from './utils';
import {
  Courier,
  ParseOptions,
  FetchOptions,
  TrackingEvent,
  TrackingStatus,
} from '../types';
import * as DateFns from 'date-fns';
import { ups } from 'ts-tracking-number';

// prettier-ignore
const statusCodes = reverseOneToManyDictionary({
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

type ShipmentPackage = DeepPartial<{
  status: {
    description: string;
    type: string;
  };
  location: {
    address: {
      city: string;
      stateProvince: string;
      countryCode: string;
      postalCode: string;
    };
  };
  date: string;
  time: string;
}>;

const getTime = ({
  date,
  time,
}: {
  date: string | undefined;
  time: string | undefined;
}): number | undefined => {
  if (!date && !time) {
    return;
  }

  const dateString = `${date ?? ``}${time ?? ``}`;
  const formatString = `${date ? `yyyyMMdd` : ``}${time ? `Hmmss` : ``}`;

  const parsedDate = DateFns.parse(dateString, formatString, new Date());

  return parsedDate.getTime();
};

const getStatus = (
  status: ShipmentPackage['status']
): TrackingStatus | undefined => {
  if (!status) {
    return;
  }

  const trackingStatus = status.type
    ? statusCodes[status.type as keyof typeof statusCodes]
    : undefined;

  if (
    TrackingStatus.EXCEPTION === trackingStatus &&
    status.description?.includes('DELIVERY ATTEMPTED')
  ) {
    return TrackingStatus.DELIVERY_ATTEMPTED;
  }

  return trackingStatus;
};

const getTrackingEvent = ({
  date,
  location,
  status,
  time,
}: ShipmentPackage): TrackingEvent => ({
  status: (status && getStatus(status)) || undefined,
  label: status?.description,
  location: getLocation({
    city: location?.address?.city,
    state: location?.address?.stateProvince,
    country: location?.address?.countryCode,
    zip: location?.address?.postalCode,
  }),
  time: getTime({ date, time }),
});

const getTrackingEvents = (shipment: any): TrackingEvent[] =>
  shipment.activity.map(getTrackingEvent);

const getEstimatedDeliveryTime = (shipment: any): number | undefined => {
  if ('EDW' !== shipment.deliveryTime?.type) {
    return;
  }

  const date = shipment.deliveryDate?.[0]?.date;
  const time = shipment.deliveryTime?.endTime;

  return getTime({ date, time });
};

const fetchOptions: FetchOptions = {
  urls: {
    dev: 'https://wwwcie.ups.com/track/v1/details/',
    prod: 'https://onlinetools.ups.com/track/v1/details/',
  },
  parameters: {
    input: (url, trackingNumber) => url + trackingNumber,
  },
  responseType: 'JSON',
};

const parseOptions: ParseOptions = {
  shipmentPath: ['trackResponse', 'shipment', '0', 'package', 0],
  checkForError: (response) =>
    'Tracking Information Not Found' ===
    response.trackResponse?.shipment?.[0]?.warnings?.[0]?.message,
  getTrackingEvents,
  getEstimatedDeliveryTime,
};

const UPS: Courier<'ups'> = {
  name: 'UPS',
  code: 'ups',
  requiredEnvVars: ['UPS_ACCESS_LICENSE_NUMBER'],
  fetchOptions,
  parseOptions,
  tsTrackingNumberCouriers: [ups],
};

export default UPS;
