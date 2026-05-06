import { z } from 'zod';
import { passengerObjectToStr, passengerStrToObject } from '@/app/lib/utils';

const fromToRegex = /^[A-Z]{3}_.+_.+$/;
const passengerRegex = /adults-\d+_children-\d+_infants-\d+/;
const classRegex = /economy|premium_economy|business|first/;
const tripTypeRegex = /one_way|round_trip|multi_city/;

export const flightSearchParamsSchema = z.object({
  from: z.string().trim().regex(fromToRegex, 'From string format is distorted'),
  to: z.string().trim().regex(fromToRegex, 'To string format is distorted'),
  tripType: z.string().trim().regex(tripTypeRegex, 'Only "one_way", "round_trip" and "multi_city" are allowed'),
  desiredDepartureDate: z.string().trim().date('Invalid date string'),
  desiredReturnDate: z.string().trim().optional(),
  class: z.string().trim().regex(classRegex, 'Only "economy", "premium_economy", "business" and "first" are allowed'),
  passengers: z.string().trim().regex(passengerRegex, 'Invalid passengers format')
    .transform((passengers, ctx) => {
      const passengerObj = passengerStrToObject(passengers);
      const totalPassengers = Object.values(passengerObj).reduce((acc, value) => +acc + +value, 0);
      if (+passengerObj.adults < +passengerObj.infants) {
        ctx.addIssue({ code: 'custom', message: 'Infants cannot be more than adults' });
        return z.NEVER;
      }
      if (totalPassengers > 9) {
        ctx.addIssue({ code: 'custom', message: 'Total passengers cannot be more than 9' });
        return z.NEVER;
      }
      return passengerObjectToStr(passengerObj);
    }),
});

export default function validateFlightSearchParams(searchParams: Record<string, any>) {
  const { success, error, data } = flightSearchParamsSchema.safeParse(searchParams);
  const errors: Record<string, string> = {};
  let successFlag = success;
  if (!success) {
    error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
  }
  if (success) {
    if (data.from === data.to) {
      successFlag = false;
      errors.from = 'From and To cannot be same';
      errors.to = 'From and To cannot be same';
    }
    if (data.tripType === 'round_trip') {
      const desiredReturnDateValidation = z.object({
        desiredReturnDate: z.string().datetime({ message: 'Valid date is required when trip type is selected as Round Trip' })
          .transform((val, ctx) => {
            if (new Date(val) < new Date(data.desiredDepartureDate)) {
              ctx.addIssue({ code: 'custom', message: 'Return date cannot be before departure date' });
              return z.NEVER;
            }
            return val;
          }),
      }).safeParse({ desiredReturnDate: searchParams.desiredReturnDate });
      if (desiredReturnDateValidation.success) {
        data.desiredReturnDate = desiredReturnDateValidation.data.desiredReturnDate;
      } else {
        successFlag = false;
        const e = desiredReturnDateValidation.error.issues[0];
        const key = typeof e.path[0] === 'string' ? e.path[0] : String(e.path[0]);
        errors[key] = e.message;
      }
    }
  }
  return { success: successFlag, errors, data };
}