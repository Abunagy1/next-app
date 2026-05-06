'use server';
import validatePassengerPreferences from '@/app/lib/zodSchemas/passengersPreferencesValidation';
import type { PassengerPreferencesZodError } from '@/app/lib/zodSchemas/passengersPreferencesValidation';

type PassengerPreferencesItem = {
  key: string;
  [key: string]: any;
};

type ValidationResult = {
  success: true;
  data: Record<string, any>;
} | {
  success: false;
  errors: Record<string, PassengerPreferencesZodError>;
};

export default async function validatePassengersPreferencesAction(
  passengersPreferencesArr: PassengerPreferencesItem[]
): Promise<ValidationResult> {
  const errors: Record<string, PassengerPreferencesZodError> = {};
  const validatedPassengersPreferences: Record<string, any> = {};

  for (const value of passengersPreferencesArr) {
    const { success, errors: e, data: d } = validatePassengerPreferences(value);
    if (!success && e) {
      errors[value.key] = e;
    }
    if (success && d) {
      validatedPassengersPreferences[value.key] = d;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true, data: validatedPassengersPreferences };
}

// 'use server';
// import validatePassengerPreferences from '@/app/lib/zodSchemas/passengersPreferencesValidation';

// type PassengerPreferencesItem = {
//   key: string;
//   [key: string]: any;
// };

// type ValidationResult = {
//   success: true;
//   data: Record<string, any>;
// } | {
//   success: false;
//   errors: Record<string, any>;
// };

// export default async function validatePassengersPreferencesAction(
//   passengersPreferencesArr: PassengerPreferencesItem[]
// ): Promise<ValidationResult> {
//   const errors: Record<string, any> = {};
//   const validatedPassengersPreferences: Record<string, any> = {};

//   for (const value of passengersPreferencesArr) {
//     const { success, errors: e, data: d } = validatePassengerPreferences(value);
//     if (!success && e) {
//       errors[value.key] = e;
//     }
//     if (success && d) {
//       validatedPassengersPreferences[value.key] = d;
//     }
//   }

//   if (Object.keys(errors).length > 0) {
//     return { success: false, errors };
//   }
//   return { success: true, data: validatedPassengersPreferences };
// }