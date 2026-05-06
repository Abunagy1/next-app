import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { addYears } from 'date-fns';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export interface Airport {
  iataCode: string;
  name: string;
  city: string;
}

export interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

export interface Filters {
  rates: string[];
  airlines: string[];
  priceRange: [number, number];
  departureTime: [number, number];
}

export interface FlightFormState {
  from: Partial<Airport>;
  to: Partial<Airport>;
  tripType: 'one_way' | 'round_trip' | 'multi_city';
  desiredDepartureDate: string;
  desiredReturnDate: string;
  passengers: Passengers;
  class: 'economy' | 'premium_economy' | 'business' | 'first';
  availableFlightDateRange: { from: number; to: number };
  filters: Filters;
  defaultFilterValues: Filters;
  errors: Record<string, any>;
}

// -----------------------------------------------------------------------------
// Helper to get current date in local timezone (YYYY-MM-DD)
// -----------------------------------------------------------------------------
const getCurrentLocalDate = (): string => {
  return new Date().toLocaleString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const currentDate = getCurrentLocalDate();

// -----------------------------------------------------------------------------
// Default state
// -----------------------------------------------------------------------------
export const defaultFlightFormValue: FlightFormState = {
  from: { iataCode: '', name: '', city: '' }, // not {}
  to: { iataCode: '', name: '', city: '' },
  tripType: 'one_way',
  desiredDepartureDate: '',
  desiredReturnDate: '',
  passengers: { adults: 1, children: 0, infants: 0 },
  class: 'economy',
  availableFlightDateRange: { from: Date.now(), to: Date.now() + 365 * 24 * 60 * 60 * 1000 },
  filters: { rates: [], airlines: [], priceRange: [400, 2000], departureTime: [0, 86340000] },
  defaultFilterValues: { rates: [], airlines: [], priceRange: [400, 2000], departureTime: [0, 86340000] },
  errors: {},
};

// -----------------------------------------------------------------------------
// Slice
// -----------------------------------------------------------------------------
const flightFormSlice = createSlice({
  name: 'flightForm',
  initialState: {
    value: defaultFlightFormValue,
  },
  reducers: {
    setFlightForm(state, action: PayloadAction<Partial<FlightFormState>>) {
      const newValue = { ...state.value, ...action.payload };
      if (action.payload?.passengers) {
        const passengerObj = newValue.passengers;
        const totalPassengers = Object.values(passengerObj).reduce((acc, val) => acc + val, 0);
        if (totalPassengers > 9) {
          newValue.errors = {
            ...state.value.errors,
            passengers: 'Total passengers cannot be more than 9',
          };
        } else if (passengerObj.adults < passengerObj.infants) {
          newValue.errors = {
            ...state.value.errors,
            passengers: 'Infants cannot be more than adults',
          };
        } else {
          const { passengers, ...restErrors } = newValue.errors || {};
          newValue.errors = restErrors;
        }
      }
      state.value = newValue;
    },
    setFlightFormFilters(state, action: PayloadAction<Partial<Filters>>) {
      state.value.filters = { ...state.value.filters, ...action.payload };
    },
    setDefaultFlightFilters(state, action: PayloadAction<Partial<Filters>>) {
      state.value.defaultFilterValues = {
        ...defaultFlightFormValue.defaultFilterValues,
        ...action.payload,
      };
    },
    resetFilters(state) {
      state.value.filters = state.value.defaultFilterValues;
    },
  },
});

export const {
  setFlightForm,
  setDefaultFlightFilters,
  setFlightFormFilters,
  resetFilters,
} = flightFormSlice.actions;

export default flightFormSlice.reducer;