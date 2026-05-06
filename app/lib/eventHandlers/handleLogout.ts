'use client';

import { signOutAction } from '@/app/lib/actions';
import { getApiResponseWithToast } from '@/app/lib/helpers.client/apiResponse';

/**
 * Handles user logout with optional success/error callbacks.
 * @param _e - (unused) event object, kept for API compatibility.
 * @param onSuccess - callback executed on successful logout.
 * @param onError - callback executed on logout failure.
 */

// app/lib/eventHandlers/handleLogout.ts

export async function handleLogout(
  e?: React.MouseEvent | null,
  onSuccess: () => void = () => {},
  onError: () => void = () => {}
): Promise<void> {
  const signOutPromise : Promise<any> = signOutAction();
  await getApiResponseWithToast(signOutPromise, { onSuccess, onError });
}