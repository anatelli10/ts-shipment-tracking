import { track } from './index';

(async (): Promise<void> => {
    const usps = await track('usps', '');
    console.log(usps);
})();
