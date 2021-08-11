import * as creds from './credentials.json';
import {
    fedex,
    ups,
    usps,
    s10,
    getTracking,
    TrackingCourier
} from 'ts-tracking-number';
import { Provider, FedexProvider, UpsProvider, UspsProvider } from './provider';
import PackageInfo from './package/PackageInfo';

/**
 * Key value pairs of courier codes (e.g. 'usps') and their ts-tracking-number data
 */
const couriers = new Map<string, TrackingCourier[]>([
    [fedex.courier_code, [fedex]],
    [ups.courier_code, [ups]],
    [usps.courier_code, [usps, s10]]
]);

/**
 * Key value pairs of courier codes and their tracking providers
 */
const providers = new Map<string, Provider>([
    [
        fedex.courier_code,
        new FedexProvider(
            creds.fedex.key,
            creds.fedex.password,
            creds.fedex.accountNumber,
            creds.fedex.meterNumber
        )
    ],
    [ups.courier_code, new UpsProvider(creds.ups.accessLicenseNumber)],
    [usps.courier_code, new UspsProvider(creds.usps.userId)]
]);

/**
 * Checks if a courier is supported
 * @param {string} courierCode The courier's short code
 * @returns {Boolean} Whether the courier is supported or not
 */
export const isCourierValid = (courierCode: string): Boolean =>
    providers.has(courierCode);

/**
 * Checks if a tracking number is valid
 * @param {string} courierCode The courier's short code
 * @param {string} trackingNumber The package tracking number
 * @returns {Boolean} Whether the tracking number is valid or not
 */
export const isNumberValid = (
    courierCode: string,
    trackingNumber: string
): Boolean => !!getTracking(trackingNumber, couriers.get(courierCode) ?? []);

/**
 * Queries the specified courier's API for tracking information
 * @param {string} courierCode The courier's short code
 * @param {string} trackingNumber The package tracking number
 * @returns {Promise<PackageInfo>} An object containing the status and estimated delivery date of the package (if it has either)
 */
export const track = async (
    courierCode: string,
    trackingNumber: string
): Promise<PackageInfo> => {
    const provider = providers.get(courierCode);
    if (!provider)
        throw new Error(
            `Courier with courier code "${courierCode}" does not exist.`
        );
    return await provider.track(trackingNumber);
};
