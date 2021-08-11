import PackageStatus from '../../package/PackageStatus';

const DELIVERED = 'D';
const IN_TRANSIT = 'I';
const BILLING_INFORMATION_RECEIVED = 'M';
const BILLING_INFORMATION_VOIDED = 'MV';
const PICKUP = 'P';
const EXCEPTION = 'X';
const RETURNED_TO_SHIPPER = 'RS';
const DELIVERED_ORIGIN_CFS = 'DO';
const DELIVERED_DESTINATION_CFS = 'DD';
const WAREHOUSING = 'W';
const NOT_AVAILABLE = 'NA';
const OUT_FOR_DELIVERY = 'O';

export default new Map<string, PackageStatus>([
    [DELIVERED, PackageStatus.DELIVERED],
    [IN_TRANSIT, PackageStatus.IN_TRANSIT],
    [BILLING_INFORMATION_RECEIVED, PackageStatus.LABEL_CREATED],
    [BILLING_INFORMATION_VOIDED, PackageStatus.EXCEPTION],
    [PICKUP, PackageStatus.LABEL_CREATED],
    [EXCEPTION, PackageStatus.EXCEPTION],
    [RETURNED_TO_SHIPPER, PackageStatus.RETURNED_TO_SENDER],
    [DELIVERED_ORIGIN_CFS, PackageStatus.IN_TRANSIT],
    [DELIVERED_DESTINATION_CFS, PackageStatus.IN_TRANSIT],
    [WAREHOUSING, PackageStatus.IN_TRANSIT],
    [NOT_AVAILABLE, PackageStatus.EXCEPTION],
    [OUT_FOR_DELIVERY, PackageStatus.OUT_FOR_DELIVERY]
]);
