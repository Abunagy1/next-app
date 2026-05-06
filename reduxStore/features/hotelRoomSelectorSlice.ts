import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of a hotel room (add or remove fields as needed)
interface HotelRoom {
  _id: string;
  hotelId?: string;
  bedOptions?: string;
  roomType?: string;
  sleepsCount?: number;
  description?: string;
  roomNumber?: string;
  floor?: number;
  // ... other properties you might have
}

interface HotelRoomsState {
  value: HotelRoom[];
}

const defaultRooms: HotelRoom[] = [];

const hotelRoomsSelector = createSlice({
  name: 'hotelRoomsSelector',
  initialState: {
    value: defaultRooms,
  } as HotelRoomsState,
  reducers: {
    addRoom(state, action: PayloadAction<HotelRoom>) {
      state.value.push(action.payload);
    },
    removeRoomById(state, action: PayloadAction<string>) {
      const keyedRooms = state.value.filter((r) => r._id === action.payload);
      keyedRooms.pop();
      const excludedKeyedRooms = state.value.filter((r) => r._id !== action.payload);
      state.value = [...excludedKeyedRooms, ...keyedRooms];
    },
    setRooms(state, action: PayloadAction<HotelRoom[]>) {
      if (!action.payload || !Array.isArray(action.payload)) {
        console.error('Invalid payload for setRooms, expected an array');
        return;
      }
      state.value = action.payload;
    },
  },
});

export const { addRoom, removeRoomById, setRooms } = hotelRoomsSelector.actions;
export default hotelRoomsSelector.reducer;