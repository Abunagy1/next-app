import { z } from 'zod';

export const passengersPreferencesValidation = z.object({
  seating: z.object({
    position: z.enum(['window', 'aisle', 'middle', 'exit', 'any']),
    location: z.enum(['front', 'middle', 'back', 'any']),
    legroom: z.enum(['extra', 'standard', 'none']),
    quietZone: z.boolean(),
  }),
  baggage: z.object({
    type: z.enum(['carry-on', 'checked', 'any']),
    extraAllowance: z.boolean(),
  }),
  meal: z.object({
    type: z.enum(['vegan', 'halal', 'kosher', 'child', 'diabetic', 'vegetarian', 'gluten-free', 'standard']),
    specialMealType: z.string().optional(),
  }),
  specialAssistance: z.object({
    wheelchair: z.boolean(),
    boarding: z.boolean(),
    elderlyInfant: z.boolean(),
    medicalEquipment: z.boolean(),
  }),
  other: z.object({
    entertainment: z.boolean(),
    wifi: z.boolean(),
    powerOutlet: z.boolean(),
  }),
});

export type PassengerPreferencesZodError = Partial<Record<keyof z.infer<typeof passengersPreferencesValidation>, string>>;

export default function validatePassengerPreferences(obj: any) {
  const { success, error, data } = passengersPreferencesValidation.safeParse(obj);
  const errors: PassengerPreferencesZodError = {};
  let successFlag = success;
  if (!success) {
    successFlag = false;
    error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key as keyof PassengerPreferencesZodError] = issue.message;
    });
  }
  return { success: successFlag, errors: Object.keys(errors).length ? errors : undefined, data };
}