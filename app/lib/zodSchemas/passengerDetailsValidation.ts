import { z } from 'zod';
export const passengerDetailsValidation = z.object({
  passengerType: z.enum(['Adult', 'Child', 'Infant']),
  title: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().date('Invalid date string'),
  passportNumber: z.string().min(1, 'Passport number is required'),
  passportExpiryDate: z.string().date('Invalid date string'),
  country: z.string().min(1, 'Country is required'),
  flightClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
  gender: z.enum(['male', 'female']),
  frequentFlyerAirline: z.string().optional(),
  frequentFlyerNumber: z.string().optional(),
  phoneNumber: z.object({
    dialCode: z.string().min(1, 'Calling code is required'),
    number: z.string().regex(/^\d+$/, 'Invalid phone number. Only numbers are allowed').min(1, 'Phone number is required'),
  }),
  email: z.string().email('Invalid email address'),
  isPrimary: z.boolean(),
  metaData: z.any().optional(),
});

export type PassengerDetailsZodError = Partial<Record<keyof z.infer<typeof passengerDetailsValidation>, string>>;

export default function validatePassengerDetails(obj: any) {
  const { success, error, data } = passengerDetailsValidation.safeParse(obj);
  const errors: PassengerDetailsZodError = {};
  let successFlag = success;
  if (!success) {
    successFlag = false;
    error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key as keyof PassengerDetailsZodError] = issue.message;
    });
  }
  return { success: successFlag, errors: Object.keys(errors).length ? errors : undefined, data };
}