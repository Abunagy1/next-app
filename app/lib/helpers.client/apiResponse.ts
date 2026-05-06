'use client';

import { toast } from 'sonner';
import { isPromise } from '@/app/lib/utils';

export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export interface HandleApiOptions {
  onSuccess?: (data: ApiResponse, options?: any) => void;
  onError?: (error: any, options?: any) => void;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  id?: string;
}

export async function getApiResponseWithToast(
  apiCallPromise: Promise<ApiResponse>,
  options: HandleApiOptions = {}
): Promise<ApiResponse> {
  const {
    onSuccess,
    onError,
    loadingMessage,
    successMessage,
    errorMessage,
    id,
  } = options;

  if (loadingMessage && isPromise(apiCallPromise)) {
    toast.loading(loadingMessage, { id });
  }

  try {
    const response = await apiCallPromise;
    if (response.success) {
      toast.success(successMessage || response.message || 'Operation successful!', { id });
      if (onSuccess) onSuccess(response, { id });
    } else if (response.success === false) {
      toast.error(errorMessage || response.message || 'Something went wrong.', { id });
      if (onError) onError(response, { id });
    }
    return response;
  } catch (err) {
    toast.error(errorMessage || 'Network error. Please try again.', { id });
    if (onError) onError(err, { id });
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}