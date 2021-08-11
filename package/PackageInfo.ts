import PackageStatus from './PackageStatus';

export default class PackageInfo {
    status: PackageStatus;
    label?: string;
    deliveryTime?: number;

    constructor(
        status: PackageStatus = PackageStatus.UNAVAILABLE,
        label?: string,
        deliveryTime?: number
    ) {
        this.status = status;
        this.label = label;
        this.deliveryTime = deliveryTime;
    }
}
