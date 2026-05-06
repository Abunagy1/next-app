"use client";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/local-ui/Dropdown";
import { AlertTriangle, BedDouble, Minus, Plus, User } from "lucide-react";
import { formatCurrency, groupBy } from "@/app/lib/utils";
import { hotelPriceCalculation, singleRoomFareBreakdown } from "@/app/lib/helpers/hotels/priceCalculation";
import { useDispatch, useSelector } from "react-redux";
import { addRoom, removeRoomById, setRooms } from "@/reduxStore/features/hotelRoomSelectorSlice";
import validateGuestForm from "@/app/lib/zodSchemas/hotelGuestsFormValidation";

function RoomSelectorSummary({ guests, totalCapacity, isValid, handleProceed }: { guests: number; totalCapacity: number; isValid: boolean; handleProceed: () => void }) {
  return (
    <div id="room-selector-summary" className="z-40 mx-auto flex min-h-[120px] w-full items-center rounded-lg border bg-white px-2 py-2 shadow-md transition-all duration-300 sm:px-4 sm:py-3 sticky top-[20px] dark:bg-gray-800 dark:text-gray-200" aria-live="polite" role="region">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 sm:text-base"><User className="text-primary" />Total Guests: {guests}</span>
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 sm:text-base"><BedDouble className="text-primary" />Total Capacity: {totalCapacity}</span>
        </div>
        {totalCapacity < guests ? (
          <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto">
            <span className="self-start rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 sm:self-end">No beds available or You didn&apos;t select any Rooms yet</span>
            <span className="self-start text-xs text-red-500 sm:self-end">Please select more rooms to accommodate all guests.</span>
          </div>
        ) : (
          <div className="mt-2 flex w-full flex-col sm:w-auto sm:items-center sm:gap-2">
            <span className="text-xs text-green-600">All guests can be accommodated.</span>
            <Button onClick={handleProceed} className="mt-2 w-full sm:ml-4 sm:w-fit sm:self-end" disabled={!isValid}>Continue</Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface RoomSelectorProps {
  nextStep: string;
  rooms: any[];
  guests?: number;
}

export function RoomSelector({ nextStep, rooms, guests = 1 }: RoomSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [hasGuestFormErrors, setHasGuestFormErrors] = useState(false);

  useEffect(() => {
    const guestsDetails = JSON.parse(sessionStorage.getItem("guests") || "{}");
    const selectedRooms = JSON.parse(sessionStorage.getItem("selectedRooms") || "[]");
    const guestsArr = Object.values(guestsDetails);
    const guestData = guestsArr.length ? guestsArr : Array(guests).fill({});
    const err: any = {};
    guestData.forEach((guestForm: any, idx: number) => {
      const validate = validateGuestForm(guestForm);
      if (!validate.success) err[idx] = validate.errors;
    });
    if (Object.keys(err).length) {
      sessionStorage.setItem("guestsFormErrors", JSON.stringify(err));
      queueMicrotask(() => setHasGuestFormErrors(true));
    }
    dispatch(setRooms(selectedRooms));
  }, []);

  const selectedRoomGroups = useSelector((state: any) => state.hotelRoomsSelector.value);
  const groupedByRoomType = useMemo(() => groupBy(rooms, (room: any) => room.roomType), [rooms]);
  const totalCapacity = selectedRoomGroups.reduce((acc: number, curr: any) => acc + +curr.sleepsCount, 0);
  const isValid = totalCapacity >= guests;

  // const handleIncrement = (room: any) => dispatch(addRoom(room));
  // const handleIncrement = (room: any) => {
  //   const cleanRoom = { ...room };
  //   delete cleanRoom.created_at;
  //   delete cleanRoom.updated_at;
  //   dispatch(addRoom(cleanRoom));
  // };
  const handleIncrement = (room: any) => {
    const cleanRoom = { ...(room.toObject ? room.toObject() : room) };
    delete cleanRoom.created_at;
    delete cleanRoom.updated_at;
    delete cleanRoom.createdAt;
    delete cleanRoom.updatedAt;
    if (cleanRoom.price?.discount?.validUntil) {
      delete cleanRoom.price.discount.validUntil;
      // or convert it to a string: cleanRoom.price.discount.validUntil = cleanRoom.price.discount.validUntil.toISOString();
    }
    dispatch(addRoom(cleanRoom));
  };
  const handleDecrement = (key: string) => dispatch(removeRoomById(key));
  const handleProceed = () => {
    sessionStorage.setItem("selectedRooms", JSON.stringify(selectedRoomGroups));
    router.push(`${pathname}?tab=${nextStep}`);
  };
  const setProgress = (step: string) => router.push(`${pathname}?tab=${step}`);

  if (hasGuestFormErrors) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-md border border-red-300 bg-red-50 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-6 w-6" /><h2 className="text-xl font-semibold">Incomplete Guest Details</h2></div>
        <p className="max-w-md text-center text-sm text-red-700">Please fix the guest details and try again.</p>
        <Button size="lg" onClick={() => setProgress("guest_info")} className="bg-red-600 font-semibold text-white hover:bg-red-700">Go Back & Fix Details</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoomSelectorSummary guests={guests} totalCapacity={totalCapacity} isValid={isValid} handleProceed={handleProceed} />
      {Object.entries(groupedByRoomType).map(([roomType, rooms]: any) => {
        const groupByBedOptions = groupBy(rooms, (room: any) => room.bedOptions);
        return (
          <Dropdown key={roomType} open={roomType === "Budget Room"} title={roomType}>
            <div className="space-y-4 p-4">
              {Object.entries(groupByBedOptions).map(([bedOption, rooms]: any) => {
                const sortedRooms = rooms.sort((r1: any, r2: any) => hotelPriceCalculation(r1.price, 1).total - hotelPriceCalculation(r2.price, 1).total);
                const room = sortedRooms[0];
                const price = singleRoomFareBreakdown(room, 1);
                const selectedRooms = selectedRoomGroups.filter((r: any) => r.bedOptions === bedOption && r.roomType === roomType);
                const selected = selectedRooms.length;
                const max = rooms.length;
                return (
                  <div key={room._id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <Image src={room.images[0]} alt="Room image" width={64} height={64} className="aspect-square rounded-md object-cover" />
                      <div>
                        <p className="text-sm font-medium">Sleeps {room.sleepsCount} | {room.bedOptions}</p>
                        <p className="text-xs font-bold opacity-60">{formatCurrency(price.total)} / night</p>
                        <p className="text-xs opacity-60">Available rooms: {max}</p>
                      </div>
                    </div>
                    <div className="flex select-none items-center gap-2 space-x-2">
                      <Button className="rounded-full border-2" variant="outline" size="icon" onClick={() => { if (selected) handleDecrement(selectedRooms[0]?._id); }} disabled={selected === 0}><Minus /></Button>
                      <span className="w-5 text-center text-lg font-semibold">{selected}</span>
                      <Button className="rounded-full" size="icon" onClick={() => { const roomToAdd = sortedRooms.find((r: any) => !selectedRooms.map((el: any) => el._id).includes(r._id)); if (roomToAdd) handleIncrement(roomToAdd); }} disabled={selected === max}><Plus /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Dropdown>
        );
      })}
    </div>
  );
}