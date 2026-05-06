import { singleSegmentFareBreakdown } from './priceCalculations';

interface PassengerBreakdown {
  base: number;
  tax: number;
  serviceFee: number;
  discount: number;
  totalBeforeDiscount: number;
  discountedTotalPerPassenger: number;
  total: number;
  count: number;
  baseUnit: number;
  taxUnit: number;
  serviceFeeUnit: number;
  discountUnit: number;
}

interface CombinedBreakdown {
  fareBreakdowns: Record<string, PassengerBreakdown>;
  total: number;
}

export function multiSegmentCombinedFareBreakDown(
  segments: any[] = [],
  passengersCountObj: Record<string, number> = {},
  cabinClass: string = "economy",
): CombinedBreakdown {
  const segmentBreakdowns = segments.map((segment) =>
    singleSegmentFareBreakdown(segment, passengersCountObj, cabinClass),
  );

  const combinedBreakdown: CombinedBreakdown = {
    fareBreakdowns: {},
    total: 0,
  };

  Object.keys(passengersCountObj).forEach((passengerType) => {
    if (!passengersCountObj[passengerType]) return;

    combinedBreakdown.fareBreakdowns[passengerType] = {
      base: 0,
      tax: 0,
      serviceFee: 0,
      discount: 0,
      totalBeforeDiscount: 0,
      discountedTotalPerPassenger: 0,
      total: 0,
      count: passengersCountObj[passengerType] ?? 0,
      baseUnit: 0,
      taxUnit: 0,
      serviceFeeUnit: 0,
      discountUnit: 0,
    };

    segmentBreakdowns.forEach((segmentBreakdown) => {
      const passengerBreakdown = segmentBreakdown.fareBreakdowns[passengerType];
      if (!passengerBreakdown) return;

      const target = combinedBreakdown.fareBreakdowns[passengerType];
      (Object.keys(target) as (keyof PassengerBreakdown)[]).forEach((key) => {
        if (key !== "count") {
          const val = passengerBreakdown[key];
          if (typeof val === "number") {
            (target as any)[key] = ((target as any)[key] ?? 0) + val;
          }
        }
      });
    });
  });

  combinedBreakdown.total = Object.values(combinedBreakdown.fareBreakdowns).reduce(
    (sum, b) => sum + (b.total || 0),
    0,
  );

  return combinedBreakdown;
}