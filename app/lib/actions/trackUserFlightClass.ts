// app/lib/actions/trackUserFlightClass.ts
'use server';

import { cookies } from 'next/headers';

/**
 * Tracks the user's selected flight class by setting a cookie.
 * This is used to remember the flight class across the search and booking flow.
 *
 * @param prevState - Previous state (unused, for useActionState compatibility)
 * @param formData - FormData containing 'flightClass' field
 * @returns Object with success status and message
 */
export default async function trackUserFlightClass(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const flightClass = formData.get('flightClass') as string;

  if (!flightClass) {
    return { success: false, message: 'No flight class provided' };
  }

  const cookieStore = await cookies();

  // Set the flight class cookie with appropriate options
  cookieStore.set('fc', flightClass, {
    path: '/flights',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365, // 1 year (original used a huge number, but 1 year is sufficient)
  });

  return { success: true, message: 'Flight class tracked successfully' };
}