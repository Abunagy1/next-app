'use server';
import validateFlightSearchParams from '@/app/lib/zodSchemas/flightSearchParams';
import { setCookiesAction } from './cookiesActions';

type ValidateSearchStateResult = {
  success: true;
  data: {
    latestSearchState: Record<string, any>;
    sessionTimeoutAt: number;
  };
} | {
  success: false;
  errors: Record<string, string>;
};

export async function validateSearchStateAction(
  prevState: any,
  formData: FormData
): Promise<ValidateSearchStateResult> {
  const data = Object.fromEntries(formData);
  const { success, errors, data: d } = validateFlightSearchParams(data);

  if (!success || !d) {
    return { success: false, errors: (errors as Record<string, string>) || { form: 'Invalid search parameters' } };
  }

  try {
    const sessionTimeoutAt = Date.now() + 1200 * 1000; // 20 minutes from now
    await setCookiesAction([
      {
        name: 'flightSearchState',
        value: JSON.stringify(d),
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'sessionTimeoutAt',
        value: sessionTimeoutAt,
        expires: new Date(sessionTimeoutAt),
      },
    ]);
    return {
      success: true,
      data: {
        latestSearchState: d as Record<string, any>,
        sessionTimeoutAt,
      },
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}