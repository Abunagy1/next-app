import { ObjectId } from 'mongodb';
import { addDays, addMinutes, subMinutes } from 'date-fns';
import { lerp, normalize } from '../../../utils';

// ==================== Full Interfaces (matching original data) ====================
interface Airline {
  _id: string;
  iataCode: string;
  name: string;
  logo?: string;
  contact?: any;
  airlinePolicy?: any;
}

interface AirlineFlightPrice {
  airlineCode: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  distance: { lengthIn: string; value: number };
  basePrice: {
    economy: { adult: number; child: number; infant: number };
    premium_economy: { adult: number; child: number; infant: number };
    business: { adult: number; child: number; infant: number };
    first: { adult: number; child: number; infant: number };
  };
  discount: {
    adult: { type: string; amount: number };
    child: { type: string; amount: number };
    infant: { type: string; amount: number };
  };
  serviceFee: {
    adult: { type: string; amount: number };
    child: { type: string; amount: number };
    infant: { type: string; amount: number };
  };
  taxes: {
    adult: { type: string; amount: number };
    child: { type: string; amount: number };
    infant: { type: string; amount: number };
  };
}

interface Airport {
  _id: string;
  iataCode: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  facilities?: string[];
  image?: string;
}

interface Airplane {
  _id: string;
  airlineId: string;
  model: string;
  cruiseSpeed: { speedIn: string; per: string; value: number };
  classes: string[];
  totalSeats: number;
  seats: Array<{
    _id?: string;
    seatNumber: string;
    class: string;
  }>;
  images?: string[];
}

interface BaggageAllowance {
  currency: string;
  carryOn: {
    maxPieces: number;
    maxWeight: { measurementUnit: string; value: number };
    maxDimensions: { length: number; width: number; height: number; measurementUnit: string };
  };
  checked: {
    maxPieces: number;
    maxWeight: { measurementUnit: string; value: number };
  };
  excessWeightFee: { feeAmount: number; currency: string; feeType: string };
  excessPieceFee: { feeAmount: number; currency: string; feeType: string };
}

interface FlightItinerary {
  _id: string;
  flightCode: string;
  carrierInCharge: string;
  date: Date;
  departureAirportId: string;
  arrivalAirportId: string;
  segmentIds: string[];
  totalDurationMinutes: number;
  layovers: Array<{ fromSegmentIndex: number; durationMinutes: number }>;
  baggageAllowance: BaggageAllowance;
  status: string;
  expireAt: Date;
}

interface FlightSegment {
  _id: string;
  flightNumber: string;
  date: Date;
  airlineId: string;
  from: {
    airport: string;
    scheduledDeparture: Date;
    terminal: string;
    gate: string;
  };
  to: {
    airport: string;
    scheduledArrival: Date;
    terminal: string;
    gate: string;
  };
  airplaneId: string;
  durationMinutes: number;
  seats: string[];
  fareDetails: AirlineFlightPrice;
  baggageAllowance: BaggageAllowance;
  status: string;
  expireAt: Date;
}

interface FlightSeat {
  _id: string;
  seatNumber: string;
  airplaneId: string;
  segmentId: string;
  class: string;
  reservation: {
    type: string | null;
    expiresAt: number;
    for: string | null;
  };
  expireAt: Date;
}

// ==================== Helper Functions ====================
const flightDurationFactors = {
  climbDescentTime: 30,
  taxiTime: 20,
  atcDirectives: 15,
  aircraftWeight: 10,
  altitudeChanges: 5,
  fuelEfficiency: 20,
  airportSlotTimes: 15,
  maintenanceIssues: 10,
};

const layoverFactors = {
  minimumConnectionTime: 60,
  securityAndImmigration: 30,
  airportCongestion: 15,
  boardingDeboarding: 20,
  terminalChange: 20,
  baggageRecheck: 15,
};

const airlineFlightNumberPatterns: Record<string, { min: number; max: number; evenOdd: boolean }> = {
  AA: { min: 1, max: 3000, evenOdd: true },
  DL: { min: 1, max: 3000, evenOdd: true },
  UA: { min: 1, max: 3000, evenOdd: true },
  WN: { min: 1, max: 4000, evenOdd: false },
  BA: { min: 1, max: 3000, evenOdd: true },
  LH: { min: 1, max: 5000, evenOdd: true },
  NH: { min: 1, max: 2000, evenOdd: true },
  SQ: { min: 1, max: 4000, evenOdd: true },
  EK: { min: 1, max: 3000, evenOdd: true },
  FZ: { min: 1, max: 3000, evenOdd: true },
  EY: { min: 1, max: 3000, evenOdd: true },
};

// ==================== Main Generator ====================
export default function generateOneDayFlight(
  airlines: Airline[],
  airlineFlightPrices: AirlineFlightPrice[],
  airports: Airport[],
  airplanes: Airplane[],
  lastFlightDate: Date
): {
  flightItinerary: FlightItinerary[];
  flightSegments: FlightSegment[];
  flightSeats: FlightSeat[];
} {
  const flightItineraries: FlightItinerary[] = [];
  const flightSegments: FlightSegment[] = [];
  const flightSeats: FlightSeat[] = [];
  const flightTimes = ['04:00', '12:00', '20:00'];
  const stopFlightRatio = 0.3;
  const nextDayFromLastFlight = addDays(new Date(lastFlightDate), 1);
  const maxTotalFlightDuration = 2900;
  const minTotalFlightDuration = 180;

  for (const airline of airlines) {
    const routes = airlineFlightPrices.filter((f) => f.airlineCode === airline._id);
    const airlineAircrafts = airplanes.filter((ap) => ap.airlineId === airline._id);
    for (const route of routes) {
      for (const time of flightTimes) {
        const [hours, minutes] = time.split(':').map(Number);
        const departureTime = new Date(nextDayFromLastFlight);
        departureTime.setUTCHours(hours, minutes, 0, 0);
        const choosingAirplane = airlineAircrafts[Math.floor(Math.random() * airlineAircrafts.length)];

        // Build seat objects with string IDs
        const seats = choosingAirplane.seats.map((seat) => ({
          ...seat,
          _id: new ObjectId().toString(),
          airplaneId: choosingAirplane._id,
          reservation: { type: null, expiresAt: 0, for: null },
          expireAt: subMinutes(departureTime, 30),
        }));

        const departureAirportId = route.departureAirportCode;
        const arrivalAirportId = route.arrivalAirportCode;
        const routeDistance = +route.distance.value;
        const airplaneCruiseSpeed = +choosingAirplane.cruiseSpeed.value;
        const flightDurationInMinutes = (routeDistance / airplaneCruiseSpeed) * 60;
        let totalFlightDuration =
          Object.values(flightDurationFactors).reduce((acc, curr) => +acc + curr, flightDurationInMinutes) +
          Math.floor(Math.random() * 120);
        const reductionPercentageForDuration = lerp(
          0,
          10,
          normalize(totalFlightDuration, minTotalFlightDuration, maxTotalFlightDuration)
        );
        let discount = reductionPercentageForDuration;
        const arrivalTime = addMinutes(departureTime, totalFlightDuration);
        const isStopFlight = Math.random() <= stopFlightRatio;

        let segmentIds: string[] = [];
        let segments: FlightSegment[] = [];
        let layovers: Array<{ fromSegmentIndex: number; durationMinutes: number }> = [];

        // Base segment (non‑stop)
        const baseSegmentId = new ObjectId().toString();
        const baseSegmentSeats = seats.map((seat) => ({
          ...seat,
          _id: new ObjectId().toString(),
          segmentId: baseSegmentId,
        }));
        const baseSegment = createSegment({
          segmentId: baseSegmentId,
          airlineId: airline._id,
          fromAirport: departureAirportId,
          toAirport: arrivalAirportId,
          departureTime,
          arrivalTime,
          airplaneId: choosingAirplane._id,
          duration: totalFlightDuration,
          seats: baseSegmentSeats.map((s) => s._id),
          route,
          airlineFlightPrices,
          discount,
          airline,
        });
        segments.push(baseSegment);
        segmentIds.push(baseSegmentId);
        let segment1Seats: FlightSeat[] = [],
          segment2Seats: FlightSeat[] = [];

        if (isStopFlight) {
          const totalLayoverDuration =
            Object.values(layoverFactors).reduce((acc, curr) => +acc + curr, 0) + Math.floor(Math.random() * 120);
          const randomAirport = selectRandomStop(airports, departureAirportId, arrivalAirportId);
          const originToStopRoute = routes.find(
            (r) => r.departureAirportCode === departureAirportId && r.arrivalAirportCode === randomAirport._id
          );
          const stopToDestRoute = routes.find(
            (r) => r.departureAirportCode === randomAirport._id && r.arrivalAirportCode === arrivalAirportId
          );
          if (!originToStopRoute || !stopToDestRoute) continue;

          const segment1Duration = calculateSegmentDuration(originToStopRoute, choosingAirplane);
          const segment2Duration = calculateSegmentDuration(stopToDestRoute, choosingAirplane);
          totalFlightDuration = segment1Duration + segment2Duration + totalLayoverDuration;
          discount = combineDiscounts([
            lerp(0, 10, normalize(totalFlightDuration, minTotalFlightDuration, maxTotalFlightDuration)),
            50,
          ]);

          const segment1Arrival = addMinutes(departureTime, segment1Duration);
          const segment2Departure = addMinutes(segment1Arrival, totalLayoverDuration);
          const segment2Arrival = addMinutes(segment2Departure, segment2Duration);

          const segment1Id = new ObjectId().toString();
          const segment2Id = new ObjectId().toString();
          segment1Seats = seats.map((seat) => ({
            ...seat,
            _id: new ObjectId().toString(),
            segmentId: segment1Id,
          }));
          segment2Seats = seats.map((seat) => ({
            ...seat,
            _id: new ObjectId().toString(),
            segmentId: segment2Id,
          }));

          segments = [
            createSegment({
              segmentId: segment1Id,
              airlineId: airline._id,
              fromAirport: departureAirportId,
              toAirport: randomAirport._id,
              departureTime,
              arrivalTime: segment1Arrival,
              airplaneId: choosingAirplane._id,
              duration: segment1Duration,
              seats: segment1Seats.map((s) => s._id),
              route: originToStopRoute,
              airlineFlightPrices,
              discount,
              airline,
            }),
            createSegment({
              segmentId: segment2Id,
              airlineId: airline._id,
              fromAirport: randomAirport._id,
              toAirport: arrivalAirportId,
              departureTime: segment2Departure,
              arrivalTime: segment2Arrival,
              airplaneId: choosingAirplane._id,
              duration: segment2Duration,
              seats: segment2Seats.map((s) => s._id),
              route: stopToDestRoute,
              airlineFlightPrices,
              discount,
              airline,
            }),
          ];
          segmentIds = [segment1Id, segment2Id];
          layovers = [{ fromSegmentIndex: 0, durationMinutes: totalLayoverDuration }];
        }

        const flightCode = generateFlightNumber(
          airline.iataCode,
          departureAirportId,
          arrivalAirportId,
          departureTime,
          time
        );

        flightSegments.push(
          ...segments.map((segment) => ({
            ...segment,
            flightNumber: `${flightCode}-${segmentIds.indexOf(segment._id) + 1}`,
            date: departureTime,
            expireAt: subMinutes(departureTime, 30),
          }))
        );

        flightItineraries.push({
          _id: new ObjectId().toString(),
          flightCode,
          carrierInCharge: airline._id,
          date: departureTime,
          departureAirportId,
          arrivalAirportId,
          segmentIds,
          totalDurationMinutes: totalFlightDuration,
          layovers,
          baggageAllowance: generateBaggageAllowance(airline),
          status: 'scheduled',
          expireAt: subMinutes(departureTime, 30),
        });

        flightSeats.push(...baseSegmentSeats, ...segment1Seats, ...segment2Seats);
      }
    }
  }

  return {
    flightItinerary: flightItineraries,
    flightSegments,
    flightSeats,
  };
}

// ==================== Helper Implementations (fully typed) ====================
function createSegment({
  segmentId,
  airlineId,
  fromAirport,
  toAirport,
  departureTime,
  arrivalTime,
  airplaneId,
  duration,
  seats,
  route,
  airlineFlightPrices,
  discount,
  airline,
}: {
  segmentId: string;
  airlineId: string;
  fromAirport: string;
  toAirport: string;
  departureTime: Date;
  arrivalTime: Date;
  airplaneId: string;
  duration: number;
  seats: string[];
  route: AirlineFlightPrice;
  airlineFlightPrices: AirlineFlightPrice[];
  discount: number;
  airline: Airline;
}): FlightSegment {
  return {
    _id: segmentId,
    flightNumber: '',
    date: departureTime,
    airlineId,
    from: {
      airport: fromAirport,
      scheduledDeparture: departureTime,
      terminal: Math.floor(Math.random() * 4).toString(),
      gate: Math.floor(Math.random() * 4).toString(),
    },
    to: {
      airport: toAirport,
      scheduledArrival: arrivalTime,
      terminal: Math.floor(Math.random() * 4).toString(),
      gate: Math.floor(Math.random() * 4).toString(),
    },
    airplaneId,
    durationMinutes: duration,
    seats,
    fareDetails: generateFareDetails(route, airlineFlightPrices, { _id: airlineId }, discount),
    baggageAllowance: generateBaggageAllowance(airline),
    status: 'scheduled',
    expireAt: subMinutes(departureTime, 30),
  };
}

function calculateSegmentDuration(route: AirlineFlightPrice, airplane: Airplane): number {
  const distance = +route.distance.value;
  const speed = +airplane.cruiseSpeed.value;
  return (distance / speed) * 60 + Object.values(flightDurationFactors).reduce((a, c) => a + c, 0);
}

function generateFlightNumber(
  airlineCode: string,
  departureAirport: string,
  arrivalAirport: string,
  date: Date,
  time: string
): string {
  const pattern = airlineFlightNumberPatterns[airlineCode] || { min: 1, max: 3000, evenOdd: true };
  const timeSlot = getTimeSlot(time);
  const routeTimeKey = `${airlineCode}-${departureAirport}-${arrivalAirport}-${timeSlot}`;
  const dateKey = date.toISOString().split('T')[0];
  const baseNumber = (hashCode(routeTimeKey) % (pattern.max - pattern.min)) + pattern.min;
  const dateVariation = hashCode(dateKey) % 100;
  let flightNum = baseNumber + dateVariation;
  if (pattern.evenOdd) {
    const isEastbound = departureAirport < arrivalAirport;
    flightNum = isEastbound
      ? flightNum % 2 === 0
        ? flightNum
        : flightNum + 1
      : flightNum % 2 === 1
      ? flightNum
      : flightNum + 1;
  }
  flightNum = Math.max(pattern.min, Math.min(pattern.max, flightNum));
  const flightNumStr = String(flightNum).padStart(4, '0').slice(-4);
  const letterSuffix = Math.random() > 0.9 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : '';
  return `${airlineCode}${flightNumStr}${letterSuffix}`;
}

function getTimeSlot(timeString: string): string {
  const hour = parseInt(timeString.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function generateFareDetails(
  route: AirlineFlightPrice,
  airlineFlightPrices: AirlineFlightPrice[],
  airline: { _id: string },
  discount: number
): AirlineFlightPrice {
  const currentRoutePrice = airlineFlightPrices.find(
    (r) =>
      r.airlineCode === airline._id &&
      r.departureAirportCode === route.departureAirportCode &&
      r.arrivalAirportCode === route.arrivalAirportCode
  )!;
  const flightPrice = JSON.parse(JSON.stringify(currentRoutePrice));
  const flightClasses = ['economy', 'premium_economy', 'business', 'first'] as const;
  const randomPriceMultiplier = lerp(1.2, 1.6, Math.random());
  for (const classs of flightClasses) {
    flightPrice.basePrice[classs] = {
      adult: +flightPrice.basePrice[classs].adult * randomPriceMultiplier,
      child: +flightPrice.basePrice[classs].child * randomPriceMultiplier,
      infant: +flightPrice.basePrice[classs].infant * randomPriceMultiplier,
    };
  }
  // Apply discount (preserve the original structure)
  Object.entries(currentRoutePrice.discount).forEach(([key, value]: [string, any]) => {
    flightPrice.discount[key] = {
      type: 'percentage',
      amount: value.amount ? Math.floor(combineDiscounts([value.amount, discount])) : 0,
    };
  });
  // Note: serviceFee and taxes remain unchanged (they are not modified in original)
  return flightPrice;
}

function generateBaggageAllowance(airline: Airline): BaggageAllowance {
  if (airline.airlinePolicy?.baggageAllowance) return airline.airlinePolicy.baggageAllowance;
  return {
    currency: 'USD',
    carryOn: {
      maxPieces: 1,
      maxWeight: { measurementUnit: 'kg', value: 7 },
      maxDimensions: { length: 55, width: 40, height: 20, measurementUnit: 'cm' },
    },
    checked: {
      maxPieces: 1,
      maxWeight: { measurementUnit: 'kg', value: 23 },
    },
    excessWeightFee: { feeAmount: 50, currency: 'USD', feeType: 'perKg' },
    excessPieceFee: { feeAmount: 100, currency: 'USD', feeType: 'perPiece' },
  };
}

function selectRandomStop(airports: Airport[], originId: string, destinationId: string): Airport {
  const possibleStops = airports.filter(
    (airport) => airport._id !== originId && airport._id !== destinationId
  );
  return possibleStops[Math.floor(Math.random() * possibleStops.length)];
}

function combineDiscounts(discounts: number[]): number {
  return discounts.reduce((acc, d) => acc * (1 - d / 100), 1) * 100;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}