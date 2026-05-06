import { z } from 'zod';

export const flightSearchFilterValidation = z.object({
  rates: z.array(z.string()).optional().transform((rates, ctx) => {
    if (!rates) return rates;
    const hasInvalidRate = rates.some((rate) => !['1', '2', '3', '4', '5'].includes(rate));
    if (hasInvalidRate) {
      ctx.addIssue({ code: 'custom', message: 'There is an invalid value in rates', path: ['rates'] });
      return z.NEVER;
    }
    return rates;
  }),
  airlines: z.array(z.string()).optional(),
  priceRange: z.array(z.number()).min(2, 'Price range must have a minimum and maximum value').optional(),
  departureTime: z.array(z.number()).min(2, 'Departure time range must have a minimum and maximum value').optional(),
});

export default function validateFlightSearchFilter(obj: any) {
  const { success, error, data } = flightSearchFilterValidation.safeParse(obj);
  const errors: Record<string, string> = {};
  let successFlag = success;
  if (!success) {
    successFlag = false;
    error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
  }
  return { success: successFlag, errors: Object.keys(errors).length ? errors : undefined, data };
}