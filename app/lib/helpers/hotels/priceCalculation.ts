/* eslint-disable @typescript-eslint/no-explicit-any */
import { groupBy } from '@/app/lib/utils';
export function hotelPriceCalculation(dbPriceObj: any, guestsCount: number) {
  // Guard against null/undefined price object
  if (!dbPriceObj || typeof dbPriceObj !== 'object') {
    //console.warn('hotelPriceCalculation: invalid dbPriceObj', dbPriceObj);
    return {
      base: 0,
      tax: 0,
      serviceFee: 0,
      discount: 0,
      discountPercentage: undefined,
      totalBeforeDiscount: 0,
      discountedTotalPerPassenger: 0,
      total: 0,
      guestsCount,
      baseUnit: 0,
      taxUnit: 0,
      serviceFeeUnit: 0,
      discountUnit: 0,
    };
  }
  const base = +(dbPriceObj.base || 0);
  const tax = +(dbPriceObj.tax || 0);
  const serviceFee = +(dbPriceObj.serviceFee || 0);
  const discountObj = dbPriceObj.discount || { type: 'percentage', amount: 0 };
  let discount = 0;
  let discountPercentage: number | undefined;
  if (discountObj.type === 'percentage') {
    discount = base * ((discountObj.amount || 0) / 100);
    discountPercentage = discountObj.amount;
  } else if (discountObj.type === 'fixed') {
    discount = +(discountObj.amount || 0);
  }
  const totalBeforeDiscount = base + tax + serviceFee;
  const discountedTotalPerPassenger = totalBeforeDiscount - discount;
  const total = discountedTotalPerPassenger * guestsCount;
  return {
    base: base * guestsCount,
    tax: tax * guestsCount,
    serviceFee: serviceFee * guestsCount,
    discount: discount * guestsCount,
    discountPercentage,
    totalBeforeDiscount: totalBeforeDiscount * guestsCount,
    discountedTotalPerPassenger,
    total,
    guestsCount,
    baseUnit: base,
    taxUnit: tax,
    serviceFeeUnit: serviceFee,
    discountUnit: discount,
  };
}
export function singleRoomFareBreakdown(room: any, guests: number = 1) {
  if (!room) {
    console.warn('singleRoomFareBreakdown: room missing');
    return { fareBreakdowns: hotelPriceCalculation(null, guests), total: 0, roomDetails: room };
  }
  let fare = room.price;
  // Handle JSON string (PostgreSQL JSONB might be returned as string)
  if (typeof fare === 'string') {
    try {
      fare = JSON.parse(fare);
    } catch (e) {
      console.warn('Failed to parse room.price string:', fare, e);
      fare = null;
    }
    //try { fare = JSON.parse(fare); } catch (_) { fare = {}; }
  }
  if (!fare || typeof fare !== 'object') {
    console.warn('singleRoomFareBreakdown: invalid room.price', room.price);
    return { fareBreakdowns: hotelPriceCalculation(null, guests), total: 0, roomDetails: room };
  }
  const fareBreakdowns = hotelPriceCalculation(fare, guests);
  const total = fareBreakdowns.total;
  return { fareBreakdowns, total, roomDetails: room };
}
// ... keep multiRoomCombinedFareBreakDown unchanged
export function multiRoomCombinedFareBreakDown(selectedRooms: any[], guests: number = 1) {
  const roomsSorted = [...selectedRooms].sort((a, b) => {
    let aDiscountAmount = 0;
    let bDiscountAmount = 0;
    if (a.price.discount.type === 'percentage') {
      aDiscountAmount = a.price.base * (+a.price.discount.amount / 100);
    } else {
      aDiscountAmount = +a.price.discount.amount;
    }
    if (b.price.discount.type === 'percentage') {
      bDiscountAmount = b.price.base * (+b.price.discount.amount / 100);
    } else {
      bDiscountAmount = +b.price.discount.amount;
    }
    const aPrice = +a.price.base + +a.price.tax - aDiscountAmount + +a.price.serviceFee;
    const bPrice = +b.price.base + +b.price.tax - bDiscountAmount + +b.price.serviceFee;
    return aPrice - bPrice;
  });
  const groupByRoomType = groupBy(roomsSorted, (room) => room.roomType);
  const combinedBreakdown: any = { fareBreakdowns: {}, total: 0 };
  const roomsByRoomType: Record<string, any> = {};
  for (const [roomType, rooms] of Object.entries(groupByRoomType)) {
    const roomsByBedOptions: Record<string, any> = {};
    for (const room of rooms as any[]) {
      const bedOption = room.bedOptions;
      if (!roomsByBedOptions[bedOption]) {
        roomsByBedOptions[bedOption] = {
          base: 0,
          tax: 0,
          serviceFee: 0,
          discount: 0,
          total: 0,
          rooms: [],
        };
      }
      const priceInfo = singleRoomFareBreakdown(room, guests).fareBreakdowns;
      roomsByBedOptions[bedOption].base += priceInfo.base;
      roomsByBedOptions[bedOption].tax += priceInfo.tax;
      roomsByBedOptions[bedOption].serviceFee += priceInfo.serviceFee;
      roomsByBedOptions[bedOption].discount += priceInfo.discount;
      roomsByBedOptions[bedOption].total += priceInfo.total;
      roomsByBedOptions[bedOption].rooms.push({
        description: room.description,
        roomType: room.roomType,
        bedOptions: room.bedOptions,
        roomNumber: room.roomNumber,
      });
    }
    roomsByRoomType[roomType] = roomsByBedOptions;
  }
  combinedBreakdown.fareBreakdowns = roomsByRoomType;
  const roomTypesVal = Object.values(roomsByRoomType).reduce((acc, val) => ({ ...acc, ...val }), {});
  combinedBreakdown.total = Object.values(roomTypesVal).reduce((acc: number, val: any) => acc + val.total, 0);
  return combinedBreakdown;
}