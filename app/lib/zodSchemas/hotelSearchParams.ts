import { z } from 'zod';
import { isDateObjValid } from '@/app/lib/utils';
import { differenceInDays, startOfDay } from 'date-fns';

export const hotelSearchParamsZodSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  checkIn: z.union([z.string(), z.number(), z.nan()]).transform((val, ctx) => {
    let d = val;
    if (!isNaN(+val)) d = +val;
    if (!isDateObjValid(d)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid check-in date' });
      return z.NEVER;
    }
    const today = startOfDay(new Date());
    const checkInDate = new Date(d).getTime();
    if (checkInDate < today.getTime()) {
      ctx.addIssue({ code: 'custom', message: 'Check-in date cannot be in the past' });
      return z.NEVER;
    }
    return checkInDate;
  }),
  checkOut: z.union([z.string(), z.number(), z.nan()]).transform((val, ctx) => {
    let d = val;
    if (!isNaN(+val)) d = +val;
    if (!isDateObjValid(d)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid check-out date' });
      return z.NEVER;
    }
    return new Date(d).getTime();
  }),
  rooms: z.union([z.number(), z.string()]).transform((val, ctx) => {
    if (isNaN(+val)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid rooms input, not a number' });
      return z.NEVER;
    }
    const v = +val;
    if (v > 5) {
      ctx.addIssue({ code: 'custom', message: 'Rooms cannot be more than 9' });
      return z.NEVER;
    }
    if (v < 1) {
      ctx.addIssue({ code: 'custom', message: 'Rooms cannot be less than 1' });
      return z.NEVER;
    }
    return v;
  }),
  guests: z.union([z.number(), z.string()]).transform((val, ctx) => {
    if (isNaN(+val)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid guests input, not a number' });
      return z.NEVER;
    }
    const v = +val;
    if (v > 9) {
      ctx.addIssue({ code: 'custom', message: 'Guests cannot be more than 9' });
      return z.NEVER;
    }
    if (v < 1) {
      ctx.addIssue({ code: 'custom', message: 'Guests cannot be less than 1' });
      return z.NEVER;
    }
    return v;
  }),
}).superRefine((val, ctx) => {
  if (val.checkIn > val.checkOut) {
    ctx.addIssue({ code: 'custom', message: 'Check-in date cannot be after check-out date', path: ['checkIn'] });
  }
  if (Math.abs(differenceInDays(val.checkOut, val.checkIn)) < 1) {
    ctx.addIssue({ code: 'custom', message: 'Check-out have to be at least 1 day after check-in', path: ['checkOut'] });
  }
});

export default function validateHotelSearchParams(d: any) {
  const { success, error, data } = hotelSearchParamsZodSchema.safeParse(d);
  const errors: Record<string, string> = {};
  const successFlag = success;
  if (!success) {
    error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
  }
  return { success: successFlag, errors, data };
}