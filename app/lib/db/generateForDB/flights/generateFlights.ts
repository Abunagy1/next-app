import mongoose from 'mongoose';
import generateOneDayFlight from './generateOneDayFlight';
import { addDays, subDays } from 'date-fns';
import { createAgeGroupSchema } from '../../schema/airlineFlightPrices';

export interface Airline {
  _id: string;
  iataCode: string;
  name: string;
  logo?: string;
  contact?: any;
  airlinePolicy?: any;
}

export interface AirlineFlightPrice {
  airlineCode: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  distance: { lengthIn: string; value: number };
  basePrice: any;
  discount: any;
  serviceFee: any;
  taxes: any;
}

export interface Airport {
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

export interface Airplane {
  _id: string;   // ✅ now string (not ObjectId)
  airlineId: string;
  model: string;
  cruiseSpeed: { speedIn: string; per: string; value: number };
  classes: string[];
  totalSeats: number;
  seats: any[];
  images?: string[];
}

export interface GeneratedFlightDay {
  flightItinerary: any[];
  flightSegments: any[];
  flightSeats: any[];
}

export async function generateFlightsDB(
  howManyDays: number = 10,
  airportsDBData: Airport[],
  airplanesDBData: Airplane[],
  airlinesDBData: Airline[],
  airlineFlightPricesDBData: AirlineFlightPrice[]
): Promise<GeneratedFlightDay[]> {
  const flightData: GeneratedFlightDay[] = [];
  // const startDate = subDays(new Date(), 1); // Start from yesterday to have some past flights for testing 
  const startDate = addDays(new Date(), 1); // Start from tomorrow to ensure all flights are in the future
  for (let i = 0; i < howManyDays; i++) {
    const currentDate = addDays(startDate, i);
    const oneDayFlight = generateOneDayFlight(
      airlinesDBData,
      airlineFlightPricesDBData,
      airportsDBData,
      airplanesDBData,
      currentDate
    );
    flightData.push(oneDayFlight);
  }
  return flightData;
}

export async function generateAirplanesDB(primaryAirplaneData: any[]) {
  const airplaneData: Airplane[] = [];
  for (const airplane of primaryAirplaneData) {
    const limitSeats: Record<string, number> = {
      first: 4,
      business: 8,
      premium_economy: 12,
      economy: 16,
    };
    const airplaneDbObj: Airplane = {
      _id: new mongoose.Types.ObjectId().toString(),   // ✅ convert to string
      airlineId: airplane.iataCode,
      model: airplane.model,
      cruiseSpeed: {
        speedIn: airplane.cruiseSpeed.speedIn,
        per: airplane.cruiseSpeed.per,
        value: airplane.cruiseSpeed.value,
      },
      classes: airplane.classes,
      images: airplane.images,
      seats: [],
      totalSeats: airplane.classes.map((cls: string) => limitSeats[cls]).reduce((a: number, b: number) => a + b, 0),
    };
    const seatData: any[] = [];
    for (const classs of airplane.classes) {
      let seatCount = 0;
      for (const seat of airplane.seatMap[classs].seatNumbers) {
        if (seatCount >= limitSeats[classs]) break;
        seatData.push({
          _id: new mongoose.Types.ObjectId().toString(),   // ✅ convert to string
          airplaneId: airplaneDbObj._id,
          seatNumber: seat,
          class: classs,
        });
        seatCount++;
      }
    }
    airplaneDbObj.seats = seatData;
    airplaneData.push(airplaneDbObj);
  }
  const seatData = airplaneData.flatMap((el) => el.seats);
  return { airplaneData, seatData };
}

export async function generateAirlinesDB(primaryAirlinedata: any[]) {
  const airlineData: Airline[] = [];
  for (const airline of primaryAirlinedata) {
    const cancellationPolicy = {
      gracePeriodHours: 24,
      cutoffHoursBeforeDeparture: 3,
      fareRules: {
        refundable: { cancellable: true, refundType: 'full', cancellationFee: 0 },
        nonRefundable: { cancellable: false, refundType: null, cancellationFee: null },
        promo: { cancellable: true, refundType: 'voucher', cancellationFee: 50 },
        flex: { cancellable: true, refundType: 'full', cancellationFee: 0 },
      },
      allowVoucherInsteadOfRefund: true,
      notes: 'Promo fares refundable only as vouchers. Refunds processed within 7-10 business days.',
    };
    airlineData.push({
      _id: airline.iataCode,
      iataCode: airline.iataCode,
      name: airline.name,
      logo: airline?.logo || '',
      contact: airline.contact,
      airlinePolicy: { cancellationPolicy },
    });
  }
  return airlineData;
}

export async function generateAirlineFlightPricesDB(primaryAirlinedata: any[]) {
  let airlineFlightPricesData: AirlineFlightPrice[] = [];
  const flightBasePricePerMile: Record<string, number> = {
    first: 0.5,
    business: 0.4,
    premium_economy: 0.25,
    economy: 0.15,
  };
  const basePriceReductionForPassengerTypesPecentage = {
    adult: 0,
    child: 20,
    infant: 90,
  };
  for (const airline of primaryAirlinedata) {
    const pricesByRoutes = airline.operatingRoutes.map((route: any) => {
      const distance = route.distance.value;
      const { adult, child, infant } = basePriceReductionForPassengerTypesPecentage;
      const basePrice: any = {};
      Object.entries(flightBasePricePerMile).forEach(([classs, price]) => {
        basePrice[classs] = {
          adult: distance * price * ((100 - adult) / 100),
          child: distance * price * ((100 - child) / 100),
          infant: distance * price * ((100 - infant) / 100),
        };
      });
      const shouldDiscountApply = Math.random() <= 0.2;
      const discount = shouldDiscountApply
        ? { amountType: 'percentage', amount: 20 }
        : { amountType: 'percentage', amount: 0 };
      return {
        airlineCode: airline.iataCode,
        departureAirportCode: route.departureAirportCode,
        arrivalAirportCode: route.arrivalAirportCode,
        distance: { lengthIn: route.distance.lengthIn, value: distance },
        basePrice,
        discount: createAgeGroupSchema(discount),
        serviceFee: createAgeGroupSchema({ amountType: 'percentage', amount: 2 }),
        taxes: createAgeGroupSchema({ amountType: 'percentage', amount: 10 }),
      };
    });
    airlineFlightPricesData = airlineFlightPricesData.concat(pricesByRoutes);
  }
  return airlineFlightPricesData;
}

export async function generateAirportsDB(primaryAirportData: any[]) {
  const airportData: Airport[] = [];
  for (const airport of primaryAirportData) {
    airportData.push({
      _id: airport.iataCode,
      image: 'null',
      ...airport,
    });
  }
  return airportData;
}