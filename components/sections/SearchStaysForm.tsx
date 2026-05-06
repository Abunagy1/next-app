'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { DatePicker } from '@/components/local-ui/DatePicker';
import { HotelDestinationPopover } from '@/components/local-ui/HotelDestinationPopover';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { forwardRef, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  defaultHotelFormValue,
  setStayForm,
} from '@/reduxStore/features/stayFormSlice';
import { useRouter } from 'next/navigation';
import { addDays, format } from 'date-fns';
import { cn, isDateObjValid, objDeepCompare } from '@/app/lib/utils';
import { Skeleton } from '../ui/skeleton';
import Counter from '../local-ui/Counter';
import validateHotelSearchParams from '@/app/lib/zodSchemas/hotelSearchParams';
import { Loader } from 'lucide-react';
import { jumpTo } from '../local-ui/Jumper';
import { getCookiesAction, setCookiesAction } from '@/app/lib/actions/cookiesActions';
//import { ErrorMessage } from '../local-ui/errorMessage';
import addToSearchHistoryAction from '@/app/lib/actions/addToSearchHistoryAction';
// Types
interface Destination {
  city: string;
  country: string;
}

interface StayFormData {
  destination: Destination;
  checkIn: string | null;
  checkOut: string | null;
  rooms: number;
  guests: number;
  errors?: Record<string, string>;
}

interface SearchStaysFormProps {
  params?: { hotelSearchParams?: string };
}

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
    <div className="h-full w-full p-4 dark:bg-gray-800">
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

export function SearchStaysForm({ params = {} }: SearchStaysFormProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [popperOpened, setPopperOpened] = useState(false);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRoomsGuestOpen, setIsRoomsGuestOpen] = useState(false);
  const stayFormData = useSelector((state: any) => state.stayForm.value) as StayFormData;
  const errors = stayFormData.errors || {};
  const spStr = params?.hotelSearchParams;
  function getSearchStateParams() {
    const p = params?.hotelSearchParams || '';
    const searchParams = new URLSearchParams(decodeURIComponent(p));
    const validateHotelFormData = validateHotelSearchParams(Object.fromEntries(searchParams));
    const data = validateHotelFormData?.data || {};
    const errors = validateHotelFormData?.errors || {};
    return { ...data, errors };
  }
  async function getSearchStateCookies() {
    const state = (await getCookiesAction(['hotelSearchState']))[0]?.value || '{}';
    const validate = validateHotelSearchParams(JSON.parse(state));
    const data = validate?.data || {};
    const errors = validate?.errors || {};
    return state === '{}' ? { errors: {} } : { ...data, errors };
  }
  const lastSpStr = useRef<string | undefined>(undefined); // ← new

  useEffect(() => {
    // Guard: skip if already processed this search
    if (lastSpStr.current === spStr) return;       // ← new
    lastSpStr.current = spStr;                       // ← new

    async function searchState() {
      setIsFormLoading(true);
      const p = getSearchStateParams();
      if ('hotelSearchParams' in params && params.hotelSearchParams) {
        const newFormData = {
          ...defaultHotelFormValue,
          ...{
            ...p,
            destination: { city: (p as any).city || '', country: (p as any).country || '' },
          },
          ...p,
        };
        if (Object.keys(newFormData.errors || {}).length > 0) {
          dispatch(setStayForm(newFormData));
        } else {
          const obj = {
            ...p,
            destination: { city: (p as any).city || '', country: (p as any).country || '' },
          };
          delete (obj as any).city;
          delete (obj as any).country;
          dispatch(setStayForm({ ...defaultHotelFormValue, ...obj }));
        }
        setIsFormLoading(false);
        return;
      }

      const searchState = await getSearchStateCookies();
      const searchStateCookie = JSON.parse(
        (await getCookiesAction(['hotelSearchState']))[0]?.value || '{}'
      );
      if (Object.keys(searchState.errors || {}).length > 0) {
        dispatch(
          setStayForm({
            ...defaultHotelFormValue,
            ...{
              ...searchStateCookie,
              destination: { city: searchStateCookie.city || '', country: searchStateCookie.country || '' },
            },
            ...searchState,
          })
        );
      } else {
        const obj = {
          ...searchState,
          destination: { city: (searchState as any).city || '', country: (searchState as any).country || '' },
        };
        delete (obj as any).city;
        delete (obj as any).country;
        dispatch(setStayForm({ ...defaultHotelFormValue, ...obj }));
      }
      setIsFormLoading(false);
    }
    searchState();
    const timer = setTimeout(() => jumpTo('hotelResults'), 500);
    return () => clearTimeout(timer);
  }, [spStr, dispatch]); // ✅ Removed `params` from dependencies

  const handleDestinationSelected = useCallback(
    (selected: { city: string; country: string }) => {
      if (selected && Object.keys(selected).length > 0) {
        dispatch(setStayForm({ destination: { city: selected.city, country: selected.country } }));
      }
    },
    [dispatch]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSending(true);
    console.log('search submitted');
    const sp = {
      ...stayFormData.destination,
      checkIn: stayFormData.checkIn ? new Date(stayFormData.checkIn).getTime() : Date.now(),
      checkOut: stayFormData.checkOut ? new Date(stayFormData.checkOut).getTime() : Date.now() + 86400000,
      rooms: stayFormData.rooms,
      guests: stayFormData.guests,
    };

    let searchState: any = {};
    if ('hotelSearchParams' in params && params.hotelSearchParams) {
      searchState = getSearchStateParams();
    }

    if (searchState.errors && Object.keys(searchState.errors).length > 0) {
      dispatch(setStayForm({ errors: { ...searchState.errors } }));
      setIsSending(false);
      return;
    }

    searchState = await getSearchStateCookies();

    //const { success: sSState, errors: eSState, data: dSState } = validateHotelSearchParams(searchState);
    const { success: sFForm, errors: eFForm, data: dFForm } = validateHotelSearchParams(sp);
    // sSState, eSState not used, remove them:
    const { data: dSState } = validateHotelSearchParams(searchState);
    if (sFForm === false) {
      dispatch(setStayForm({ errors: { ...eFForm } }));
      setIsSending(false);
      return;
    }

    const areTheySame = objDeepCompare(dFForm, dSState);
    const shouldPreventFromSubmit = areTheySame && 'hotelSearchParams' in params && params.hotelSearchParams;

    if (shouldPreventFromSubmit) {
      jumpTo('hotelResults');
      setIsSending(false);
      return;
    }

    const res = await setCookiesAction([
      {
        name: 'hotelSearchState',
        value: JSON.stringify(dFForm),
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    ]);
    if (!res?.success) {
      setIsSending(false);
      return;
    }
    // inside handleSubmit, right before router.push
    try {
      await addToSearchHistoryAction('hotel', dFForm);
    } catch (e) {
      console.error('Search history action failed:', e);
      // still continue – the search should work even if history fails
    }
    dispatch(setStayForm({ errors: {} }));
    const queryString = new URLSearchParams(dFForm as any).toString();
    router.push(`/hotels/search/${encodeURIComponent(queryString)}`, { scroll: false });
    setTimeout(() => jumpTo('hotelResults'), 500);
  }

  const checkInDateObj = stayFormData.checkIn ? new Date(stayFormData.checkIn) : null;
  const checkOutDateObj = stayFormData.checkOut ? new Date(stayFormData.checkOut) : null;
  return (
    <form id="stayForm" method="get" onSubmit={handleSubmit} className="dark:bg-gray-800" key={params?.hotelSearchParams}>
      <div className="col-span-full">
        {Object.keys(errors).length > 0 && (
          <div className="text-xs">
            <ol>
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>
                  <span className="font-bold capitalize">{key}</span>: {msg}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <div className="my-[20px] grid grid-cols-4 gap-4">
        {/* Destination */}
        <div
          className={cn('relative col-span-full flex h-auto min-h-[100px] flex-col gap-2 rounded-[8px] border-2 border-primary dark:border-gray-600 md:flex-row lg:col-span-1',
            (errors?.city || errors?.country) && 'border-destructive'
          )}
        >
          <span className="absolute -top-[8px] left-[16px] z-10 inline-block bg-white px-[4px] leading-none dark:bg-gray-800 dark:text-gray-300">
            Enter Destination <span className="text-red-600">*</span>
          </span>
          <HotelDestinationPopover
            key={stayFormData.destination?.city + stayFormData.destination?.country}
            isLoading={isFormLoading}
            className="h-full w-full rounded-[8px] border-0 py-4 pl-4"
            fetchInputs={{
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/hotels/available_places`,
              searchParamsName: 'searchQuery',
              method: 'GET',
            }}
            defaultSelected={{
              city: stayFormData.destination?.city || '',
              country: stayFormData.destination?.country || '',
            }}
            excludeVals={[]}
            getSelected={handleDestinationSelected} // ✅ Memoized callback
          />
        </div>

        {/* Check In / Check Out */}
        <div
          className={cn(
            'relative col-span-full flex h-auto flex-col gap-2 rounded-[8px] border-2 border-primary md:flex-row lg:col-span-2',
            (errors?.checkIn || errors?.checkOut) && 'border-destructive'
          )}
        >
          <InputLabel
            label={
              <>
                Check In <span className="text-red-600">*</span> - Check Out<span className="text-red-600">*</span>
              </>
            }
          />
          <div
            className={cn(
              'h-auto max-h-[100px] min-h-[100px] max-w-full grow rounded-none border-0 border-primary max-md:mx-1 max-md:border-b-2 md:my-1 md:w-1/2 md:border-r-2',
              errors?.checkIn && 'border-destructive'
            )}
          >
            <DatePicker
              loading={isFormLoading}
              date={checkInDateObj}
              customInput={
                <DatePickerCustomInput
                  open={popperOpened}
                  setOpen={setPopperOpened}
                  loading={isLoadingDateRange || isFormLoading}
                />
              }
              setDate={(date) => {
                let d: string | null = null;
                if (date && isDateObjValid(date)) {
                  d = date.toLocaleString('en-CA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  });
                }
                dispatch(setStayForm({ checkIn: d }));
              }}
            />
          </div>
          <div
            className={cn(
              'h-auto max-h-[100px] min-h-[100px] max-w-full grow rounded-none border-0 border-primary max-md:mx-1 max-md:border-t-2 md:my-1 md:w-1/2 md:border-l-2',
              errors?.checkOut && 'border-destructive'
            )}
          >
            <DatePicker
              loading={isFormLoading}
              date={checkOutDateObj}
              required={false}
              customInput={
                <DatePickerCustomInput
                  open={popperOpened}
                  setOpen={setPopperOpened}
                  loading={isLoadingDateRange || isFormLoading}
                />
              }
              minDate={addDays(new Date(stayFormData.checkIn || new Date()), 1)}
              setDate={(date) => {
                let d: string | null = null;
                if (date && isDateObjValid(date)) {
                  d = date.toLocaleString('en-CA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  });
                }
                dispatch(setStayForm({ checkOut: d }));
              }}
            />
          </div>
        </div>

        {/* Rooms & Guests */}
        <div
          className={cn(
            'relative col-span-4 flex h-auto items-center gap-[4px] rounded-[8px] border-2 border-primary lg:col-span-1',
            (errors?.rooms || errors?.guests) && 'border-destructive'
          )}
        >
          <InputLabel label="Rooms * - Guests *" />
          <div className="h-full grow">
            <Popover open={isRoomsGuestOpen} onOpenChange={(open) => !isFormLoading && setIsRoomsGuestOpen(open)}>
              <PopoverTrigger asChild className="max-h-[100px] min-h-[100px] w-full justify-start rounded-lg p-4">
                <div>
                  {isFormLoading ? (
                    <>
                      <Skeleton className="mb-2 h-8 w-[130px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-bold dark:text-white">
                        {stayFormData.rooms} {stayFormData.rooms > 1 ? 'rooms' : 'room'}
                      </div>
                      <div className="text-md font-medium dark:text-gray-400">
                        {stayFormData.guests} {stayFormData.guests > 1 ? 'guests' : 'guest'}
                      </div>
                    </>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3 sm:w-[400px]">
                <Card className="mb-3 border-2 border-primary p-3 dark:bg-gray-800 dark:border-gray-600">
                  <CardHeader className="mb-4 p-0 dark:text-white">
                    <CardTitle>Rooms & Guests</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div>
                        <p className="text-sm font-bold dark:text-gray-300">Rooms</p>
                        <p className="text-xs dark:text-gray-400">How many rooms?</p>
                      </div>
                      <Counter
                        defaultCount={stayFormData.rooms}
                        maxCount={5}
                        minCount={1}
                        getCount={(room) => dispatch(setStayForm({ rooms: room }))}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div>
                        <p className="text-sm font-bold">Guests</p>
                        <p className="text-xs">How many guests?</p>
                      </div>
                      <Counter
                        defaultCount={stayFormData.guests}
                        maxCount={5}
                        minCount={1}
                        getCount={(guest) => dispatch(setStayForm({ guests: guest }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-[24px]">
        <Button type="submit" disabled={isFormLoading || isSending} className="w-[150px] gap-1 dark:bg-primary dark:hover:bg-primary/80 dark:text-white">
          {isSending ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            <>
              <Image width={24} height={24} src="/travel/icons/building.svg" alt="search_icon" style={{ width: 'auto', height: 'auto' }} priority/>
              <span>Show Places</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function InputLabel({ label, className }: { label: ReactNode; className?: string }) {
  return (
    <span className={cn('absolute -top-[10px] left-[10px] z-10 inline-block rounded-md bg-white px-[4px] text-sm font-medium leading-none dark:bg-gray-800 dark:text-gray-300', className)}>
      {label}
    </span>
  );
}