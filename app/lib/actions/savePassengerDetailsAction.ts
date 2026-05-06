'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';

export async function savePassengerDetailsAction(passengerData: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthenticated' };

  // Keep only the fields that the form actually needs
  const clean = {
    firstName: passengerData.firstName || '',
    lastName: passengerData.lastName || '',
    dateOfBirth: passengerData.dateOfBirth || '',
    gender: passengerData.gender || '',
    passportNumber: passengerData.passportNumber || '',
    passportExpiryDate: passengerData.passportExpiryDate || '',
    country: passengerData.country || '',
    email: passengerData.email || '',
    phone: {
      dialCode: passengerData.phone?.dialCode || '',
      number: passengerData.phone?.number || '',
    },
    frequentFlyerAirline: passengerData.frequentFlyerAirline || '',
    frequentFlyerNumber: passengerData.frequentFlyerNumber || '',
    passengerType: passengerData.passengerType || 'Adult',
  };

  try {
    if (dbType === 'postgres') {
      await sql`
        UPDATE users
        SET flights = COALESCE(flights, '{}'::jsonb) || jsonb_build_object(
          'savedPassengers', ${JSON.stringify([clean])}::jsonb
        )
        WHERE id = ${session.user.id}
      `;
    } else {
      await connectDB();
      await updateOneDoc('User', { _id: session.user.id }, {
        $set: { 'flights.savedPassengers': [clean] }
      });
    }
    return { success: true, message: 'Details saved' };
  } catch (error) {
    console.error('Failed to save passenger details:', error);
    return { success: false, message: 'Failed to save details' };
  }
}

export async function getSavedPassengerDetails() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT flights->'savedPassengers' as saved FROM users WHERE id = ${session.user.id}
    `;
    if (rows.length && rows[0].saved) {
      const arr = rows[0].saved;
      // PostgreSQL returns a JSON serialised array; we need the first element
      return Array.isArray(arr) ? arr[0] : arr;
    }
  } else {
    await connectDB();
    const user = await dataModels.User.findById(session.user.id).lean();
    const saved = user?.flights?.savedPassengers?.[0];
    return saved || null;
  }
  return null;
}