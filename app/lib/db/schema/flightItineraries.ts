import { Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { baggageAllowanceSchema } from "./airlines";
//import { singleSegmentFareBreakdown } from "../../helpers/flights/priceCalculations";

/**
 * Represents a flight segment's departure or arrival details
 */
interface FlightSegmentPoint {
  scheduledDeparture?: Date;
  scheduledArrival?: Date;
  [key: string]: unknown;
}

/**
 * Represents a flight segment
 */
interface FlightSegment {
  from: FlightSegmentPoint;
  to: FlightSegmentPoint;
  fareDetails?: {
    basePrice?: Record<string, Record<string, number>>;
    taxes?: Record<string, { amount: number }>;
    serviceFee?: Record<string, { amount: number }>;
    discount?: Record<string, { amount: number }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Represents a passenger breakdown entry
 */
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

/**
 * Represents passenger count configuration
 */
interface PassengerCountObj {
  [key: string]: number | undefined;
}

/**
 * Represents fare breakdowns for all passenger types
 */
interface FareBreakdowns {
  [key: string]: PassengerBreakdown;
}

/**
 * Represents the combined fare breakdown result
 */
interface CombinedBreakdown {
  fareBreakdowns: FareBreakdowns;
  total: number;
}

/**
 * Represents a layover in the flight itinerary
 */

interface Layover {
  fromSegmentIndex: number;
  durationMinutes: number;
}

const flightItinerarySchema = new Schema(
  {
    flightCode: { type: String, required: true },
    date: { type: Date, required: true },
    carrierInCharge: {
      type: String,
      ref: "Airline",
      required: true,
      autopopulate: true,
    },
    departureAirportId: {
      type: String,
      ref: "Airport",
      required: true,
      autopopulate: true,
    },
    arrivalAirportId: {
      type: String,
      ref: "Airport",
      required: true,
      autopopulate: true,
    },
    segmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "FlightSegment",
        required: true,
        autopopulate: true,
      },
    ],
    totalDurationMinutes: { type: Number, required: true },
    layovers: [
      {
        fromSegmentIndex: Number,
        durationMinutes: Number,
      },
    ],
    baggageAllowance: baggageAllowanceSchema.clone(),

    status: {
      type: String,
      enum: ["scheduled", "delayed", "departed", "arrived", "cancelled"],
      default: "scheduled",
    },
    expireAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true },
);

flightItinerarySchema.plugin(mongooseAutoPopulate);

/**
 * Calculates the duration of a flight segment in milliseconds.
 *
 * @param segment - The flight segment object containing departure and arrival information.
 * @returns The duration of the flight segment in milliseconds, or 0 if the segment is invalid.
 */
export function flightDuration(segment: FlightSegment): number {
  const depart = segment.from?.scheduledDeparture;
  const arrive = segment.to?.scheduledArrival;
  if (!depart || !arrive || !(depart instanceof Date) || !(arrive instanceof Date)) {
    return 0;
  }
  return arrive.getTime() - depart.getTime();
}

/**
 * Calculates the total duration of a set of flight segments in milliseconds.
 *
 * @param segments - An array of flight segment objects, each containing departure and arrival information.
 * @returns The total duration of all flight segments in milliseconds, or 0 if the segments is invalid.
 */
export function totalFlightDuration(segments: FlightSegment[]): number {
  return segments.reduce((total: number, segment: FlightSegment): number => {
    return total + flightDuration(segment);
  }, 0);
}
// this function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
// export function multiSegmentCombinedFareBreakDown(
//   segments: any[] = [],
//   passengersCountObj: Record<string, number> = {},
//   cabinClass: string = "economy",
// ): CombinedBreakdown {
//   const segmentBreakdowns = segments.map((segment) =>
//     singleSegmentFareBreakdown(segment, passengersCountObj, cabinClass),
//   );

//   const combinedBreakdown: CombinedBreakdown = {
//     fareBreakdowns: {},
//     total: 0,
//   };

//   Object.keys(passengersCountObj).forEach((passengerType) => {
//     if (!passengersCountObj[passengerType]) return;

//     combinedBreakdown.fareBreakdowns[passengerType] = {
//       base: 0,
//       tax: 0,
//       serviceFee: 0,
//       discount: 0,
//       totalBeforeDiscount: 0,
//       discountedTotalPerPassenger: 0,
//       total: 0,
//       count: passengersCountObj[passengerType] ?? 0,
//       baseUnit: 0,
//       taxUnit: 0,
//       serviceFeeUnit: 0,
//       discountUnit: 0,
//     };

//     // Sum up values from all segments
//     segmentBreakdowns.forEach((segmentBreakdown) => {
//       const passengerBreakdown = segmentBreakdown.fareBreakdowns[passengerType];
//       if (!passengerBreakdown) return;

//       const targetBreakdown = combinedBreakdown.fareBreakdowns[passengerType];
//       Object.keys(targetBreakdown).forEach((key) => {
//         if (key !== "count") {
//           const numericKey = key as keyof PassengerBreakdown;
//           const passengerValue = passengerBreakdown[numericKey];
//           if (typeof passengerValue === "number") {
//             targetBreakdown[numericKey] = (targetBreakdown[numericKey] ?? 0) + passengerValue;
//           }
//         }
//       });
//     });
//   });

//   combinedBreakdown.total = Object.values(combinedBreakdown.fareBreakdowns).reduce(
//     (sum: number, breakdown: PassengerBreakdown) => sum + (typeof breakdown.total === "number" ? breakdown.total : 0),
//     0,
//   );

//   return combinedBreakdown;
// }

export default flightItinerarySchema;
