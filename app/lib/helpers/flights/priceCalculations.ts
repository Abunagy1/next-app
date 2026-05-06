interface Fare {
  basePrice: Record<string, Record<string, number>>;
  taxes: Record<string, { amount: number }>;
  serviceFee: Record<string, { amount: number }>;
  discount: Record<string, { amount: number }>;
}

export function getPassengerFareDetails(
  passengerType: string,
  count: number,
  cabinClass: string,
  fare: Fare
) {
  // Safely access nested properties
  const base = +(fare?.basePrice?.[cabinClass]?.[passengerType] ?? 0);
  const taxPercent = +(fare?.taxes?.[passengerType]?.amount ?? 0);
  const feePercent = +(fare?.serviceFee?.[passengerType]?.amount ?? 0);
  const discountPercent = +(fare?.discount?.[passengerType]?.amount ?? 0);

  const tax = base * (taxPercent / 100);
  const serviceFee = base * (feePercent / 100);
  const totalBeforeDiscount = base + tax + serviceFee;
  const discount = totalBeforeDiscount * (discountPercent / 100);
  const discountedTotalPerPassenger = totalBeforeDiscount - discount;
  const total = discountedTotalPerPassenger * count;

  return {
    base: base * count,
    tax: tax * count,
    serviceFee: serviceFee * count,
    discount: discount * count,
    totalBeforeDiscount: totalBeforeDiscount * count,
    discountedTotalPerPassenger,
    total,
    count,
    baseUnit: base,
    taxUnit: tax,
    serviceFeeUnit: serviceFee,
    discountUnit: discount,
  };
}

export function singleSegmentFareBreakdown(
  segment: { fareDetails: Fare },
  passengerCountObj: Record<string, number>,
  cabinClass: string
) {
  const { fareDetails } = segment;
  const fareBreakdowns: Record<string, any> = {};
  Object.entries(passengerCountObj).forEach(([passengerType, count]) => {
    if (!count) return;
    const breakdown = getPassengerFareDetails(passengerType, count, cabinClass, fareDetails);
    fareBreakdowns[passengerType] = breakdown;
  });
  const computedTotal = Object.values(fareBreakdowns).reduce((acc, item) => acc + item.total, 0);
  return { fareBreakdowns, total: computedTotal };
}