import { configureStore } from '@reduxjs/toolkit';
import flightFormReducer from './features/flightFormSlice';
import stayFormReducer from './features/stayFormSlice';
import singlePassengerFormReducer from './features/singlePassengerFormSlice';
import hotelRoomSelectorReducer from './features/hotelRoomSelectorSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      flightForm: flightFormReducer,
      stayForm: stayFormReducer,
      singlePassengerForm: singlePassengerFormReducer,
      hotelRoomsSelector: hotelRoomSelectorReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];