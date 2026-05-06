import { addYears } from 'date-fns';
import hotelsData from '../primaryData/hotelsData.json';
import { ObjectId } from 'mongodb';

// Type for the JSON data
interface HotelData {
  hotelName: string;
  description: string;
  category: string;
  tags: string[];
  parkingIncluded: boolean;
  isDeleted: boolean;
  lastRenovationDate?: string;
  rating?: number;
  address: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
  coordinates: { lat: number; lon: number };
  rooms: Array<{
    roomNumber: number;
    roomDescription: string;
    roomType: string;
    roomFeatures: string[];
    roomAmenities: string[];
    roomImages: string[];
    roomBaseRate: number;
    roomBedOptions: string;
    roomSleepsCount: number;
    roomSmokingAllowed: boolean;
    tags: string[];
  }>;
  images: string[];
  amenities: string[];
  features: string[];
  policies?: any;
}

export async function generateHotelsDB() {
  const rooms: any[] = [];
  const hotels: any[] = [];
  const data = hotelsData as HotelData[];

  for (const hotel of data) {
    const roomIds: ObjectId[] = [];
    const hotelId = new ObjectId();
    for (const room of hotel.rooms) {
      const shouldDiscount = Math.random() < 0.3;
      const basePrice = room.roomBaseRate;
      const roomObj = {
        _id: new ObjectId(),
        hotelId,
        roomNumber: room.roomNumber,
        description: room.roomDescription,
        roomType: room.roomType,
        features: room.roomFeatures ?? [],
        amenities: room.roomAmenities ?? [],
        images: room.roomImages ?? [],
        price: {
          base: basePrice,
          tax: basePrice * 0.1,
          discount: {
            amount: shouldDiscount ? Math.floor(Math.random() * 20) : 0,
            type: 'percentage',
            validUntil: shouldDiscount ? addYears(new Date(), 10) : null,
          },
          serviceFee: basePrice * 0.02,
          currency: 'USD',
        },
        totalBeds: +room.roomBedOptions.trim()[0] || 1,
        bedOptions: room.roomBedOptions,
        sleepsCount: room.roomSleepsCount ?? 2,
        smokingAllowed: room.roomSmokingAllowed ?? false,
        maxAdults: Math.floor(Math.random() * 4) + 1,
        maxChildren: Math.floor(Math.random() * 4) + 1,
        extraBedAllowed: Math.floor(Math.random() * 2) === 1,
        floor: Math.floor(Math.random() * 10),
        tags: room.tags ?? [],
      };
      roomIds.push(roomObj._id);
      rooms.push(roomObj);
    }
    // Force address to be a plain object, never a string
    let addressObj: any = {};
    if (hotel.address) {
      if (typeof hotel.address === 'string') {
        try {
          addressObj = JSON.parse(hotel.address);
        } catch {
          addressObj = {};
        }
      } else {
        addressObj = { ...hotel.address };
      }
    }
    const slugify = (str: string) => str.toLowerCase().replace(/\s/g, '-');
    // Provide defaults for required fields
    addressObj = {
      streetAddress: hotel.address?.streetAddress || '',
      city: hotel.address?.city || 'A City',
      stateProvince: hotel.address?.stateProvince || '',
      postalCode: hotel.address?.postalCode || '',
      country: hotel.address?.country || 'Country',
    };
    const hotelObj = {
      _id: hotelId,
      slug: slugify(`${hotel.hotelName} ${hotel.category} lat${hotel.coordinates.lat} lon${hotel.coordinates.lon}`),
      name: hotel.hotelName,
      description: hotel.description,
      category: hotel.category,
      totalRooms: roomIds.length,
      rooms: roomIds,
      coordinates: hotel.coordinates,
      status: 'Opened',
      address: addressObj, // plain object now
      parkingIncluded: hotel.parkingIncluded ?? false,
      lastRenovationDate: hotel.lastRenovationDate ? new Date(hotel.lastRenovationDate) : null,
      isDeleted: hotel.isDeleted ?? false,
      query: `${hotel.hotelName}, ${addressObj.city}, ${addressObj.country}`,
      images: hotel.images ?? [],
      amenities: hotel.amenities ?? [],
      policies: {
        ...(hotel.policies ?? {}),
        paymentPolicy: { creditCards: true, cash: true },
        cancellationPolicy: {
          cancellableUntil: { unit: 'seconds', value: -86400 },
          cancellable: true,
          cancellationFee: 0,
        },
        refundPolicy: { refundable: true, refundFee: 0 },
      },
      features: hotel.features ?? [],
      tags: hotel.tags ?? [],
    };
    hotels.push(hotelObj);
  }

  return { hotel: hotels, hotelRoom: rooms };
}