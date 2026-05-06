'use server';
import validatePassengerDetails from '@/app/lib/zodSchemas/passengerDetailsValidation';

type PassengerDetailsItem = {
  key: string;
  [key: string]: any;
};

type ValidationResult = {
  success: true;
  data: Record<string, any>;
} | {
  success: false;
  errors: Record<string, any>;
};

export default async function validatePassengersDetailsAction(
  passengersDetailsArr: PassengerDetailsItem[]
): Promise<ValidationResult> {
  const errors: Record<string, any> = {};
  const validatedPassengersDetails: Record<string, any> = {};

  for (const value of passengersDetailsArr) {
    const { success, errors: e, data: d } = validatePassengerDetails(value);
    if (!success && e) {
      errors[value.key] = e;
    }
    if (success && d) {
      validatedPassengersDetails[value.key] = d;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true, data: validatedPassengersDetails };
}