import * as codes from './codes.json';
import { parse as dateParser } from 'date-fns';
import got from 'got';
import TrackingInfo from '../TrackingInfo';

interface TrackDetails {
    status: any;
    location: any;
    date: string;
    time: string;
}

interface Credentials {
    accessLicenseNumber: string;
}

const getStatus = (status: any, label: any) =>
    status === 'EXCEPTION' && label.includes('DELIVERY ATTEMPT')
        ? 'DELIVERY_ATTEMPTED'
        : status;

const getDeliveryTime = (date: any, time: any) =>
    date || time
        ? dateParser(
              `${date ?? ``}${time ?? ``}`,
              `${date ? `yyyyMMdd` : ``}${time ? `Hmmss` : ``}`,
              new Date()
          ).getTime()
        : undefined;

const getTrackingInfo = ({ status, location, date, time }: TrackDetails) => ({
    status: getStatus(codes.ups[status.type], status.description),
    label: status.description,
    location:
        [
            location.address.city,
            location.address.stateProvince,
            location.address.countryCode,
            location.address.postalCode
        ]
            .filter(Boolean)
            .join(' ') || undefined,
    deliveryTime: getDeliveryTime(date, time)
});

const parse = (response: any): TrackingInfo => ({
    events: response.trackResponse.shipment[0].package[0].activity.map(
        getTrackingInfo
    ),
    estimatedDelivery:
        response.trackResponse.shipment[0].package[0].deliveryTime?.type ===
        'EDW'
            ? getDeliveryTime(
                  response.trackResponse.shipment[0].package[0].deliveryDate &&
                      response.trackResponse.shipment[0].package[0]
                          .deliveryDate[0].date,
                  response.trackResponse.shipment[0].package[0].deliveryTime
                      ?.endTime
              )
            : undefined
});

const track = async (
    trackingNumber: string,
    { accessLicenseNumber }: Credentials
): Promise<TrackingInfo> =>
    got('https://onlinetools.ups.com/track/v1/details/' + trackingNumber, {
        headers: {
            AccessLicenseNumber: accessLicenseNumber,
            Accept: 'application/json'
        }
    }).then(res => parse(JSON.parse(res.body)));

export default track;
