import 'dotenv/config';
import { track } from './src';
import * as couriers from './src/couriers';

const { log } = console;

/**
 * Sequentially tests tracking for each courier.
 *
 * For each courier, environment variable `TEST_{COURIERNAMEUPPERCASE}_TRACKING_NUMBER`
 * must be set in order to test a respective courier's tracking.
 * e.g. TEST_FEDEX_TRACKING_NUMBER=000000000000000
 */
const test = async () => {
  // prettier-ignore
  for await (const [index, courierName] of Object.entries(Object.keys(couriers))) {
    const envVarName = `TEST_${courierName.toUpperCase()}_TRACKING_NUMBER`;
    const trackingNumber = process.env[envVarName];

    if (Number(index) > 0) {
      log('---');
    }

    log(`${courierName}:`);

    if (!trackingNumber) {
      log(
        `Please set environment variable "${envVarName}" in order to test ${courierName} tracking.`
      );
      continue;
    }

    try {
      const { events, estimatedDeliveryTime } = await track(trackingNumber);

      log(events[0]);

      if (estimatedDeliveryTime) {
        log(`Esimated delivery time: ${new Date(estimatedDeliveryTime)}`);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;

      // prettier-ignore
      log(
`Error tracking ${courierName} tracking number ${trackingNumber}:
      
    ${errorMessage}`);
    }
  }
};

test();
