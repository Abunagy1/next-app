'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addHotelAction } from '@/app/lib/actions/admin-actions';
import { toast } from 'sonner';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
interface Room {
  roomNumber: string;
  roomType: string;
  bedOptions: string;
  sleepsCount: number;
  price: number;
  floor: number;
  smokingAllowed: boolean;
}

export default function AddHotelForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 0, lon: 0 });
  const [amenities, setAmenities] = useState('');
  const [features, setFeatures] = useState('');
  const [images, setImages] = useState('');
  const [rooms, setRooms] = useState<Room[]>([{ roomNumber: '', roomType: '', bedOptions: '', sleepsCount: 1, price: 0, floor: 1, smokingAllowed: false }]);

  const handleRoomChange = (index: number, field: keyof Room, value: any) => {
    const newRooms = [...rooms];
    (newRooms[index] as any)[field] = value;
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([...rooms, { roomNumber: '', roomType: '', bedOptions: '', sleepsCount: 1, price: 0, floor: 1, smokingAllowed: false }]);
  };
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('streetAddress', streetAddress);
    formData.append('city', city);
    formData.append('country', country);
    formData.append('coordinates', JSON.stringify(coordinates));
    formData.append('amenities', amenities);
    formData.append('features', features);
    formData.append('images', imageUrls.join(','));
    formData.append('rooms', JSON.stringify(rooms));

    const res = await addHotelAction(formData);
    if (res?.success) {
      toast.success('Hotel added successfully');
      router.push('/dashboard');
    } else {
      toast.error(res?.message || 'Failed to add hotel');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Hotel Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Slug (URL)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <textarea className="w-full border rounded p-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Category</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div>
        <Label>Street Address</Label>
        <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Latitude</Label>
          <Input type="number" step="any" value={coordinates.lat} onChange={(e) => setCoordinates({ ...coordinates, lat: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input type="number" step="any" value={coordinates.lon} onChange={(e) => setCoordinates({ ...coordinates, lon: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div>
        <Label>Amenities (comma separated)</Label>
        <Input value={amenities} onChange={(e) => setAmenities(e.target.value)} />
      </div>
      <div>
        <Label>Features (comma separated)</Label>
        <Input value={features} onChange={(e) => setFeatures(e.target.value)} />
      </div>
      {/* <div>
        <Label>Image URLs (comma separated)</Label>
        <Input value={images} onChange={(e) => setImages(e.target.value)} />
      </div> */}
      <div>
        <Label>Images</Label>
        <UploadButton<OurFileRouter, 'postImageUploader'>
          endpoint="postImageUploader"
          onClientUploadComplete={(res) => {
            const urls = res?.map((file) => file.url) || [];
            setImageUrls((prev) => [...prev, ...urls]);
          }}
          onUploadError={(error: Error) => {
            toast.error(`Upload failed: ${error.message}`);
          }}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {imageUrls.map((url, idx) => (
            <Image key={idx} src={url} width={80} height={80} className="rounded object-cover" alt="" />
          ))}
        </div>
      </div>
      <h2 className="text-lg font-semibold mt-6">Rooms</h2>
      {rooms.map((room, index) => (
        <div key={index} className="border p-4 rounded space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Room Number</Label>
              <Input value={room.roomNumber} onChange={(e) => handleRoomChange(index, 'roomNumber', e.target.value)} />
            </div>
            <div>
              <Label>Room Type</Label>
              <Input value={room.roomType} onChange={(e) => handleRoomChange(index, 'roomType', e.target.value)} />
            </div>
            <div>
              <Label>Bed Options</Label>
              <Input value={room.bedOptions} onChange={(e) => handleRoomChange(index, 'bedOptions', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Sleeps Count</Label>
              <Input type="number" value={room.sleepsCount} onChange={(e) => handleRoomChange(index, 'sleepsCount', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Price per night</Label>
              <Input type="number" step="0.01" value={room.price} onChange={(e) => handleRoomChange(index, 'price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Floor</Label>
              <Input type="number" value={room.floor} onChange={(e) => handleRoomChange(index, 'floor', parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={room.smokingAllowed} onChange={(e) => handleRoomChange(index, 'smokingAllowed', e.target.checked)} />
            <Label>Smoking Allowed</Label>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addRoom}>Add Room</Button>
      <div className="pt-4">
        <Button type="submit">Add Hotel</Button>
      </div>
    </form>
  );
}