'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DatePicker } from '../local-ui/DatePicker';
import { FlightFromToPopover } from '../local-ui/FlightFromToPopover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSelector, useDispatch } from 'react-redux';
import {
  setFlightForm,
  defaultFlightFormValue,
} from '@/reduxStore/features/flightFormSlice';
import FlightPassengerAndClassSelector from '../local-ui/FlightPassengerAndClassSelector';
import {
  isDateObjValid,
  passengerObjectToStr,
  cn,
  airportObjectToStr,
  objDeepCompare,
  parseFlightSearchParams,
} from '@/app/lib/utils';
import validateFlightSearchParams from '@/app/lib/zodSchemas/flightSearchParams';
import { addDays, format } from 'date-fns';
import swap from '@/public/travel/icons/swap.svg';
import { ErrorMessage } from '../local-ui/errorMessage';
import { forwardRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCookiesAction } from '@/app/lib/actions/cookiesActions';
import { validateSearchStateAction } from '@/app/lib/actions/validateSearchstateAction';
import Jumper, { jumpTo } from '../local-ui/Jumper';
import { Skeleton } from '../ui/skeleton';
import { Loader } from 'lucide-react';
import addToSearchHistoryAction from '@/app/lib/actions/addToSearchHistoryAction';
import { toast } from 'sonner';
// --- Types ---
interface Airport {
  iataCode: string;
  name: string;
  city: string;
}

interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

type FlightClass = 'economy' | 'premium_economy' | 'business' | 'first';

interface FlightFormData {
  from: Airport;
  to: Airport;
  tripType: 'one_way' | 'round_trip' | 'multi_city';
  desiredDepartureDate: string;
  desiredReturnDate: string;
  passengers: Passengers;
  class: FlightClass;
  availableFlightDateRange: { from: number; to: number };
  errors?: Record<string, string>;
}

interface SearchFlightsFormProps {
  params?: { query?: string };
}

// --- DatePickerCustomInput Component ---
const DatePickerCustomInput = forwardRef<
  HTMLDivElement,
  {
    loading?: boolean;
    open?: boolean;
    setOpen?: (open: boolean) => void;
    value?: Date | null;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
  }
>(({ loading, open, setOpen, value, onClick, className }, ref) => {
  return loading ? (
    <div className="h-full w-full p-4">
      <Skeleton className="mb-2 h-8 w-[130px]" />
      <Skeleton className="h-4 w-[100px]" />
    </div>
  ) : isDateObjValid(value) ? (
    <div
      onClick={(e) => {
        onClick?.(e);
        setOpen?.(!open);
      }}
      className={cn('h-full w-full p-4', className)}
      ref={ref}
    >
      <div className="text-xl font-bold dark:text-white">{format(new Date(value!), 'dd MMM yy')}</div>
      <div className="text-md font-medium dark:text-gray-400">{format(new Date(value!), 'EEEE')}</div>
    </div>
  ) : (
    <div
      onClick={(e) => {
        onClick?.(e);
        setOpen?.(!open);
      }}
      className={cn('h-full w-full p-4', className)}
      ref={ref}
    >
      <div className="text-xl font-bold dark:text-white">DD MMM YY</div>
      <div className="text-md font-medium dark:text-gray-400">Weekday</div>
    </div>
  );
});
DatePickerCustomInput.displayName = 'DatePickerCustomInput';

// --- Main Component ---
export function SearchFlightsForm({ params = {} }: SearchFlightsFormProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [popperOpened, setPopperOpened] = useState(false);
  const [returnPopperOpened, setReturnPopperOpened] = useState(false);
  const flightFormData = useSelector((state: any) => state.flightForm.value) as FlightFormData;
  const errors = flightFormData?.errors || {};
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Helper functions ---
  async function getSearchStateCookies() {
    const state = (await getCookiesAction(['flightSearchState']))[0]?.value || '{}';
    const validate = validateFlightSearchParams(JSON.parse(state));
    const data = validate?.data || {};
    const errors = validate?.errors || {};
    return state === '{}' ? { errors: {} } : { ...data, errors };
  }

  function getSearchStateParams() {
    const p = new URLSearchParams(decodeURIComponent(params?.query || ''));
    const objP = Object.fromEntries(p);
    const validateFlightForm = validateFlightSearchParams(objP);
    const data = validateFlightForm?.data || {};
    const errors = validateFlightForm?.errors || {};
    return { ...data, errors };
  }

  function validateFlightForm(flightFormDataObj: FlightFormData) {
    const necessaryData = {
      from: airportObjectToStr(flightFormDataObj.from),
      to: airportObjectToStr(flightFormDataObj.to),
      tripType: flightFormDataObj.tripType,
      desiredDepartureDate: flightFormDataObj.desiredDepartureDate,
      desiredReturnDate: flightFormDataObj.desiredReturnDate,
      class: flightFormDataObj.class,
      passengers: passengerObjectToStr(flightFormDataObj.passengers),
    };
    return validateFlightSearchParams(necessaryData);
  }

  // Memoized callbacks for popover selections (prevents unnecessary re-renders)
  // const handleFromSelected = useCallback(
  //   (obj: Airport) => {
  //     dispatch(
  //       setFlightForm({
  //         ...flightFormData,
  //         from: { iataCode: obj.iataCode, name: obj.name, city: obj.city },
  //       })
  //     );
  //   },
  //   [dispatch, flightFormData]
  // );
const handleFromSelected = useCallback(
  (obj: Airport) => {
    dispatch(
      setFlightForm({
        ...flightFormData,
        from: obj && Object.keys(obj).length > 0 
          ? { iataCode: obj.iataCode, name: obj.name, city: obj.city }
          : { iataCode: '', name: '', city: '' },
      })
    );
  },
  [dispatch, flightFormData]
);
  // const handleToSelected = useCallback(
  //   (obj: Airport) => {
  //     dispatch(
  //       setFlightForm({
  //         ...flightFormData,
  //         to: { iataCode: obj.iataCode, name: obj.name, city: obj.city },
  //       })
  //     );
  //   },
  //   [dispatch, flightFormData]
  // );
  const handleToSelected = useCallback(
    (obj: Airport) => {
      dispatch(
        setFlightForm({
          ...flightFormData,
          to: obj && Object.keys(obj).length > 0 
            ? { iataCode: obj.iataCode, name: obj.name, city: obj.city }
            : { iataCode: '', name: '', city: '' },
        })
      );
    },
    [dispatch, flightFormData]
  );
  // --- Effects ---
  useEffect(() => {
    async function searchState() {
      setIsFormLoading(true);
      const p = getSearchStateParams();
      if ('query' in params) {
        const newFormData = { ...defaultFlightFormValue, ...p };
        if (Object.keys(newFormData.errors || {}).length > 0) {
          dispatch(setFlightForm(newFormData));
        } else {
          dispatch(
            setFlightForm({
              ...defaultFlightFormValue,
              ...parseFlightSearchParams(p),
            })
          );
        }
        setIsFormLoading(false);
        return;
      }

      const searchState = await getSearchStateCookies();
      if (Object.keys(searchState.errors || {}).length > 0) {
        dispatch(setFlightForm({ ...defaultFlightFormValue, ...searchState }));
      } else {
        dispatch(
          setFlightForm({
            ...defaultFlightFormValue,
            ...parseFlightSearchParams(searchState),
          })
        );
      }
      setIsFormLoading(false);
    }
    searchState();
    setTimeout(() => jumpTo('flightResult'), 500);
  }, [params?.query, dispatch]); // Only re-run when query param changes

  useEffect(() => {
    const controller = new AbortController();
    async function getAvailableFlightDateRange() {
      setIsLoadingDateRange(true);
      const cached = sessionStorage.getItem('flightDateRange');
      if (cached) {
        const { from, to, expireAt } = JSON.parse(cached);
        if (Date.now() < expireAt) {
          dispatch(setFlightForm({ availableFlightDateRange: { from, to } }));
          setIsLoadingDateRange(false);
          return;
        }
      }
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/flights/available_flight_date_range`,
          {
            method: 'GET',
            next: { revalidate: 60, tags: ['flightDateRange'] },
            signal: controller.signal,
          }
        );
        const data = await res.json();
        if (data.success === true) {
          const { from, to } = data.data;
          sessionStorage.setItem(
            'flightDateRange',
            JSON.stringify({ from, to, expireAt: Date.now() + 10 * 60 * 1000 })
          );
          dispatch(setFlightForm({ availableFlightDateRange: { from, to } }));
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
      setIsLoadingDateRange(false);
    }
    getAvailableFlightDateRange();
    return () => {
      controller.abort();
      setIsLoadingDateRange(false);
    };
  }, [popperOpened, dispatch]);

  // --- Submit handler ---
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const { success: sFForm, errors: eFForm, data: dFForm } =
      validateFlightForm(flightFormData);

    let searchState: any = {};
    if ('query' in params) searchState = getSearchStateParams();
    else searchState = await getSearchStateCookies();

    if (Object.keys(searchState.errors || {}).length > 0) {
      dispatch(setFlightForm({ errors: { ...searchState.errors } }));
      return;
    }

    const { success: sSState, errors: eSState, data: dSState } =
      validateFlightForm(parseFlightSearchParams(searchState));

    if (sFForm === false) {
      dispatch(setFlightForm({ errors: { ...eFForm } }));
      return;
    }

    const sessionTimeout = localStorage.getItem('sessionTimeoutAt') || 0;
    const currTime = Date.now();
    const areTheySame = objDeepCompare(dFForm, dSState);
    const isTimeouted = +currTime > +sessionTimeout;
    const shouldPreventFromSubmitting =
      areTheySame === true && !isTimeouted && 'query' in params;

    if (shouldPreventFromSubmitting) {
      jumpTo('flightResult');
      const newSessionTimeoutAt = Date.now() + 1200 * 1000;
      localStorage.setItem('sessionTimeoutAt', String(newSessionTimeoutAt));
      window.dispatchEvent(
        new CustomEvent('customStorage', {
          detail: { key: 'sessionTimeoutAt', newValue: newSessionTimeoutAt, oldValue: sessionTimeout },
        })
      );
      return;
    }

    const formData = new FormData();
    Object.entries(dFForm as any).forEach(([key, value]) =>
      formData.append(key, value as string)
    );

    const res = await validateSearchStateAction(undefined, formData);

    if (!res) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    if (res.success === false) {
      dispatch(setFlightForm({ errors: { ...res.errors } }));
      return;
    }

    if (res.success === true && res.data) {
      localStorage.setItem('sessionTimeoutAt', String(res.data.sessionTimeoutAt));
      window.dispatchEvent(
        new CustomEvent('customStorage', {
          detail: {
            key: 'sessionTimeoutAt',
            newValue: res.data.sessionTimeoutAt,
            oldValue: sessionTimeout,
          },
        })
      );
      await addToSearchHistoryAction('flight', dFForm);
      sessionStorage.removeItem('passengersDetails');
      dispatch(setFlightForm({ errors: {} }));
      const searchParams = new URLSearchParams(res.data.latestSearchState);
      router.push(
        `/flights/search/${encodeURIComponent(searchParams.toString())}`,
        { scroll: false }
      );
      jumpTo('flightResult');
    }
  } catch (error) {
    console.error('Search action error:', error);
    toast.error('An unexpected error occurred. Please try again.');
  } finally {
    setIsSubmitting(false); // ← Always stops the spinner
  }
}

  // Convert date string to Date object for DatePicker
  const departureDateObj = flightFormData.desiredDepartureDate ? new Date(flightFormData.desiredDepartureDate) : null;
  const returnDateObj = flightFormData.desiredReturnDate ? new Date(flightFormData.desiredReturnDate) : null;

  // --- Render ---
  return (
    <>
      <Jumper id="flightFormJump" />
      <form id="flightform" method="get" onSubmit={handleSubmit} className="dark:bg-gray-800">
        <div className="my-[20px] grid grid-cols-4 gap-4 xl:grid-cols-5 ">
          {Object.keys(errors).length > 0 && (
            <div className="col-span-full">
              <ErrorMessage
                message={
                  <ol>
                    {Object.entries(errors).map(([key, msg]) => (
                      <li key={key}>
                        <span className="font-bold">{key}</span>: {msg}
                      </li>
                    ))}
                  </ol> as any
                }
                className="text-xs"
              />
            </div>
          )}

          {/* Trip Type */}
          <div className="col-span-full mb-2 ml-2 flex flex-col gap-2">
            <span className={cn('font-bold', errors?.tripType && 'text-destructive')}>
              Trip Type
            </span>
            {isFormLoading ? (
              <Skeleton className="h-4 w-[80%]" />
            ) : (
              <TripTypeRadioGroup
                defaultValue={flightFormData.tripType}
                getValue={(value) => {
                  const typedValue = value as 'one_way' | 'round_trip' | 'multi_city';
                  if (typedValue === 'round_trip') {
                    let departureDateStr = flightFormData.desiredDepartureDate;
                    let returnDateStr = '';
                    // Validate current departure date
                    if (!departureDateStr || !isDateObjValid(departureDateStr)) {
                      const today = new Date();
                      departureDateStr = today.toLocaleString('en-CA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      });
                      returnDateStr = addDays(today, 1).toISOString();
                    } else {
                      returnDateStr = addDays(new Date(departureDateStr), 1).toISOString();
                    }
                    dispatch(
                      setFlightForm({
                        ...flightFormData,
                        tripType: typedValue,
                        desiredDepartureDate: departureDateStr,
                        desiredReturnDate: returnDateStr,
                      })
                    );
                  } else {
                    dispatch(
                      setFlightForm({
                        ...flightFormData,
                        tripType: typedValue,
                        desiredReturnDate: '',
                      })
                    );
                  }
                }}
              />
            )}
          </div>

          {/* From / To */}
          <div
            className={cn('relative col-span-full flex h-auto flex-col gap-2 rounded-[8px] border-2 border-primary dark:border-gray-600 md:flex-row lg:col-span-2',
              (errors?.to || errors?.from) && 'border-destructive'
            )}
          >
            <InputLabel label="From * - to *" />
            <FlightFromToPopover
              className={cn(
                'h-auto max-h-[100px] min-h-[100px] max-w-full grow rounded-none border-0 border-primary p-4 max-md:mx-1 max-md:border-b-2 md:my-1 md:w-1/2 md:border-r-2',
                errors?.from && 'border-destructive'
              )}
              isLoading={isFormLoading}
              fetchInputs={{
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/flights/available_airports`,
                method: 'GET',
                searchParamsName: 'searchQuery',
                next: { revalidate: 21600, tags: ['airports'] },
              }}
              excludeVals={[flightFormData.to]}
              defaultSelected={flightFormData.from}
              getSelected={handleFromSelected}
            />
            <button
              onClick={() => {
                dispatch(
                  setFlightForm({
                    ...flightFormData,
                    from: flightFormData.to,
                    to: flightFormData.from,
                  })
                );
              }}
              aria-label="swap airport names"
              type="button"
              className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary p-2 transition-all hover:border-2 hover:border-primary hover:bg-secondary-foreground"
            >
              <Image alt="" className="min-h-[16px] min-w-[16px] max-md:rotate-90" width={18} height={22} src={swap} />
            </button>
            <FlightFromToPopover
              className={cn(
                'h-auto max-h-[100px] min-h-[100px] max-w-full grow rounded-none border-0 border-primary p-4 max-md:mx-1 max-md:border-t-2 md:my-1 md:w-1/2 md:border-l-2',
                errors?.to && 'border-destructive'
              )}
              isLoading={isFormLoading}
              fetchInputs={{
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/flights/available_airports`,
                method: 'GET',
                next: { revalidate: 21600, tags: ['airports'] },
                searchParamsName: 'searchQuery',
              }}
              excludeVals={[flightFormData.from]}
              defaultSelected={flightFormData.to}
              getSelected={handleToSelected}
            />
          </div>

          {/* Depart / Return Dates */}
          <div
            className={cn(
              'relative col-span-full flex h-auto flex-col gap-2 rounded-[8px] border-2 border-primary md:flex-row lg:col-span-2',
              (errors?.desiredDepartureDate || errors?.desiredReturnDate) && 'border-destructive'
            )}
          >
            <InputLabel
              label={
                <>
                  Depart <span className="text-red-600">*</span> - Return{' '}
                  {flightFormData.tripType === 'round_trip' && <span className="text-red-600">*</span>}
                </>
              }
            />
            <div
              className={cn(
                'h-auto max-h-[100px] min-h-[100px] max-w-full grow rounded-none border-0 border-primary max-md:mx-1 max-md:border-b-2 md:my-1 md:w-1/2 md:border-r-2',
                errors?.desiredDepartureDate && 'border-destructive'
              )}
            >
              <DatePicker
                date={departureDateObj}
                loading={isLoadingDateRange || isFormLoading}
                minDate={new Date(+flightFormData.availableFlightDateRange.from)}
                maxDate={new Date(+flightFormData.availableFlightDateRange.to)}
                setDate={(date) => {
                  let d: string | undefined = undefined;
                  if (date && isDateObjValid(date)) {
                    d = date.toLocaleString('en-CA', {
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    });
                  }
                  dispatch(setFlightForm({ ...flightFormData, desiredDepartureDate: d }));
                }}
                customInput={
                  <DatePickerCustomInput
                    open={popperOpened}
                    setOpen={setPopperOpened}
                    loading={isLoadingDateRange || isFormLoading}
                  />
                }
              />
            </div>
            <div
              className={cn(
                'h-auto max-h-[100px] min-h-[100px] max-w-full grow rounded-none border-0 border-primary max-md:mx-1 max-md:border-t-2 md:my-1 md:w-1/2 md:border-l-2',
                errors?.desiredReturnDate && 'border-destructive'
              )}
            >
              <DatePicker
                className="!h-full !w-full"
                date={returnDateObj}
                loading={isLoadingDateRange || isFormLoading}
                required={false}
                minDate={
                  new Date(
                    flightFormData.desiredDepartureDate || +flightFormData.availableFlightDateRange.from
                  )
                }
                maxDate={new Date(+flightFormData.availableFlightDateRange.to)}
                setDate={(date) => {
                  if (date && isDateObjValid(date)) {
                    const d = date.toLocaleString('en-CA', {
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    });
                    dispatch(setFlightForm({ ...flightFormData, desiredReturnDate: d }));
                  } else {
                    dispatch(
                      setFlightForm({
                        ...flightFormData,
                        tripType: 'one_way',
                        desiredReturnDate: '',
                      })
                    );
                  }
                }}
                customInput={
                  <DatePickerCustomInput
                    open={returnPopperOpened} 
                    setOpen={setReturnPopperOpened}
                    loading={isLoadingDateRange || isFormLoading}
                  />
                }
              />
            </div>
          </div>

          {/* Passengers & Class */}
          <div
            className={cn(
              'relative col-span-4 flex h-auto items-center gap-[4px] rounded-[8px] border-2 border-primary xl:col-span-1',
              (errors?.passengers || errors?.class) && 'border-destructive'
            )}
          >
            <InputLabel label="Passengers * - Class *" />
            <FlightPassengerAndClassSelector
              isLoading={isFormLoading}
              flightFormData={flightFormData}
              errors={errors}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-[24px]">
          <Button disabled={isSubmitting} type="submit" className="w-[150px] gap-1 dark:bg-primary dark:hover:bg-primary/80 dark:text-white">
            {isSubmitting ? (
              <Loader className="animate-spin" />
            ) : (
              <>
                <Image width={24} height={24} src="/travel/icons/paper-plane-filled.svg" alt="paper_plane_icon" />
                <span>Show Flights</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

// --- Helper Components ---
function InputLabel({ label, className }: { label: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'absolute -top-[10px] left-[10px] z-10 inline-block rounded-md bg-white px-[4px] text-sm font-medium leading-none dark:bg-gray-800 dark:text-gray-300',
        className
      )}
    >
      {label}
    </span>
  );
}

function TripTypeRadioGroup({
  defaultValue = 'one_way',
  getValue = (_value: string) => {},
}: {
  defaultValue?: string;
  getValue?: (value: string) => void;
}) {
  return (
    <RadioGroup
      onValueChange={getValue}
      className="flex flex-wrap gap-3"
      value={defaultValue}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="one_way" id="one_way1234" className="dark:border-gray-500"/>
        <Label htmlFor="one_way1234" className="dark:text-gray-300">One Way</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="round_trip" id="round_trip1234" className="dark:border-gray-500"/> {/* Removed disabled if you want it enabled */}
        <Label htmlFor="round_trip1234" className="dark:text-gray-300">
          Round Trip
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="multi_city" id="multi_city1234" className="dark:border-gray-500"/>
        <Label htmlFor="multi_city1234" className="dark:text-gray-300">
          Multi City
        </Label>
      </div>
    </RadioGroup>
  );
}