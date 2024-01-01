import 'dotenv/config';
import { track } from './src';
import * as couriers from './src/couriers';

const { log } = console;

/**
 * A script that logs the results of sequentially testing tracking for each courier.
 *
 * For each courier, environment variable `TEST_{COURIERNAMEUPPERCASENOUNDERSCORE}_TRACKING_NUMBER`
 * must be set in order to test a respective courier's tracking.
 * e.g. TEST_FEDEX_TRACKING_NUMBER=000000000000000
 */
const test = async () => {
  const courierKeys = Object.keys(couriers);

  for await (const [index, courierName] of Object.entries(courierKeys)) {
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
      const {
        events: [mostRecentEvent],
        estimatedDeliveryTime,
      } = await track(trackingNumber);

      log(mostRecentEvent);

      if (estimatedDeliveryTime) {
        log(`Estimated delivery time: ${new Date(estimatedDeliveryTime)}`);
      }
    } catch (err) {
      const error = err as Error;

      log(`Error tracking ${courierName} tracking number ${trackingNumber}:`);
      log();
      log(`   ${error.stack ? error.stack : error.message}`);
    }
  }
};

test();
