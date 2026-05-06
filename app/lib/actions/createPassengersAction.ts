import { cookies } from 'next/headers';
import { createManyDocs } from '../db/createOperationDB';
import validatePassengersDetailsAction from './validatePassengerDetailsAction';
import validatePassengersPreferencesAction from './validatePassengersPreferencesAction';
import { sql, dbType, connectDB } from '../db/db-core';
import { randomUUID } from 'crypto';

// Type definitions
type PassengerDetails = {
  key: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  passengerType: string;
  email: string;
  phoneNumber: { dialCode: string; number: string };
  passportNumber: string;
  passportExpiryDate: string;
  country: string;
  frequentFlyerNumber?: string;
  frequentFlyerAirline?: string;
  isPrimary: boolean;
};

type PassengerPreferences = {
  key: string;
  seating: {
    position: string;
    location: string;
    legroom: string;
    quietZone: boolean;
  };
  baggage: {
    type: string;
    extraAllowance: boolean;
  };
  meal: {
    type: string;
    specialMealType?: string;
  };
  specialAssistance: {
    wheelchair: boolean;
    boarding: boolean;
    elderlyInfant: boolean;
    medicalEquipment: boolean;
  };
  other: {
    entertainment: boolean;
    wifi: boolean;
    powerOutlet: boolean;
  };
};

type CreatePassengersResult = {
  success: boolean;
  data?: any[];
  message?: string;
  errors?: {
    passengersDetails?: Record<string, any>;
    passengersPreferences?: Record<string, any>;
  };
};

export default async function createPassengersAction(
  detailsArr: PassengerDetails[],
  preferencesArr: PassengerPreferences[],
  mongodbSession?: any,
): Promise<CreatePassengersResult> {
  const pDetailsValidation = await validatePassengersDetailsAction(detailsArr);
  const pPreferencesValidation = await validatePassengersPreferencesAction(preferencesArr);

  // Collect errors manually
  const errors: CreatePassengersResult['errors'] = {};
  if (!pDetailsValidation.success) {
    errors.passengersDetails = pDetailsValidation.errors;
  }
  if (!pPreferencesValidation.success) {
    errors.passengersPreferences = pPreferencesValidation.errors;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Safe cast after guard: both succeeded
  const detailsData = (pDetailsValidation as { success: true; data: Record<string, any> }).data;
  const preferencesData = (pPreferencesValidation as { success: true; data: Record<string, any> }).data;

  const cookieStore = await cookies();
  const searchStateRaw = cookieStore.get('flightSearchState')?.value || '{}';
  const searchState = JSON.parse(searchStateRaw);

  if (Object.keys(searchState).length === 0) {
    return {
      success: false,
      message: 'No search state found, please search again',
    };
  }

  const passengersDetailsArr = Object.entries(detailsData).map(([keyI, p]) => {
    const preferencesEntry = Object.entries(preferencesData).find(([keyJ]) => keyI === keyJ);
    if (!preferencesEntry) {
      throw new Error(`Preferences not found for passenger key: ${keyI}`);
    }
    const preferences = preferencesEntry[1] as any; // validated, safe to cast

    const preferencesObj = {
      seatPreferences: {
        position: preferences.seating.position,
        location: preferences.seating.location,
        legroom: preferences.seating.legroom,
        quietZone: preferences.seating.quietZone,
      },
      baggagePreferences: {
        type: preferences.baggage.type,
        extraAllowance: preferences.baggage.extraAllowance,
      },
      mealPreferences: {
        type: preferences.meal.type,
        specialMealType: preferences.meal.specialMealType,
      },
      specialAssistance: {
        wheelChair: preferences.specialAssistance.wheelchair,
        boarding: preferences.specialAssistance.boarding,
        elderlyInfant: preferences.specialAssistance.elderlyInfant,
        medicalEquipment: preferences.specialAssistance.medicalEquipment,
      },
      other: {
        entertainment: preferences.other.entertainment,
        wifi: preferences.other.wifi,
        powerOutlet: preferences.other.powerOutlet,
      },
    };

    return {
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: new Date(p.dateOfBirth),
      gender: p.gender,
      passengerType: p.passengerType.toLowerCase(),
      email: p.email,
      phoneNumber: {
        dialCode: p.phoneNumber.dialCode,
        number: p.phoneNumber.number,
      },
      passportNumber: p.passportNumber,
      passportExpiryDate: new Date(p.passportExpiryDate),
      country: p.country,
      seatClass: searchState.class,
      frequentFlyerNumber: p.frequentFlyerNumber || null,
      frequentFlyerAirline: p.frequentFlyerAirline || null,
      preferences: preferencesObj,
      isPrimary: p.isPrimary,
    };
  });

  try {
    if (dbType === 'postgres') {
      const insertedPassengers: any[] = [];
      for (const passenger of passengersDetailsArr) {
        const id = randomUUID();
        const result = await sql`
          INSERT INTO passengers (
            id, first_name, last_name, date_of_birth, gender, passenger_type,
            email, phone_number, passport_number, passport_expiry_date, country,
            seat_class, frequent_flyer_number, frequent_flyer_airline,
            preferences, is_primary
          ) VALUES (
            ${id}, ${passenger.firstName}, ${passenger.lastName}, ${passenger.dateOfBirth},
            ${passenger.gender}, ${passenger.passengerType}, ${passenger.email},
            ${JSON.stringify(passenger.phoneNumber)}::jsonb, ${passenger.passportNumber},
            ${passenger.passportExpiryDate}, ${passenger.country}, ${passenger.seatClass},
            ${passenger.frequentFlyerNumber}, ${passenger.frequentFlyerAirline},
            ${JSON.stringify(passenger.preferences)}::jsonb, ${passenger.isPrimary}
          )
          RETURNING id
        `;
        insertedPassengers.push({ id: result[0].id, ...passenger });
      }
      return { success: true, data: insertedPassengers, message: 'Passengers created' };
    } else {
      await connectDB();
      const passengers = await createManyDocs('Passenger', passengersDetailsArr, {
        session: mongodbSession,
      });
      return { success: true, data: passengers, message: 'Passengers created' };
    }
  } catch (error) {
    console.error('Failed to create passengers:', error);
    return { success: false, message: 'Failed to create passengers' };
  }
}