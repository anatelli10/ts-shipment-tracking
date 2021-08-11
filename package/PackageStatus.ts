enum PackageStatus {
    UNAVAILABLE,
    LABEL_CREATED,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERY_ATTEMPTED,
    RETURNED_TO_SENDER,
    EXCEPTION,
    DELIVERED
}

export default PackageStatus;
