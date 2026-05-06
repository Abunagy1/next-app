'use client';
import { useState } from 'react';
import { Button } from '@/app/ui/button';
import { Card } from '@/components/ui/card';
import { currencyFormat } from '@/app/lib/utils';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  name: string;
  price: number;
  capacity: number;
  beds?: string;
  amenities?: string[];
  images?: string[];
}

interface RoomsListProps {
  rooms: Room[];
  hotelId: string;
}

export function RoomsList({ rooms, hotelId }: RoomsListProps) {
  const router = useRouter();

  const handleSelect = (roomId: string) => {
    router.push(`/hotels/${hotelId}/book?roomId=${roomId}`);
  };

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <Card key={room.id} className="p-4 flex flex-col md:flex-row gap-4">
          {room.images?.[0] && (
            <div className="w-full md:w-48 h-32 relative">
              <img src={room.images[0]} alt={room.name} className="object-cover rounded" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{room.name}</h3>
            <p className="text-sm text-gray-600">Capacity: {room.capacity} guests</p>
            {room.beds && <p className="text-sm text-gray-600">Beds: {room.beds}</p>}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {room.amenities.slice(0, 3).map((a) => (
                  <span key={a} className="bg-gray-100 px-2 py-0.5 text-xs rounded">{a}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end justify-between">
            <p className="text-2xl font-bold text-primary">{currencyFormat(room.price)}</p>
            <p className="text-sm text-gray-500">per night</p>
            <Button onClick={() => handleSelect(room.id)}>Select</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}