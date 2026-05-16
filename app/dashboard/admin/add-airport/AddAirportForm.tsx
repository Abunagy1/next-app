'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addAirportAction } from '@/app/lib/actions/admin-actions';
import { toast } from 'sonner';

export default function AddAirportForm() {
  const [iata, setIata] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [timezone, setTimezone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('iata', iata);
    formData.append('name', name);
    formData.append('city', city);
    formData.append('country', country);
    formData.append('latitude', lat);
    formData.append('longitude', lon);
    formData.append('timezone', timezone);

    const res = await addAirportAction(formData);
    if (res?.success) toast.success('Airport added');
    else toast.error(res?.message || 'Failed');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>IATA Code</Label><Input value={iata} onChange={e => setIata(e.target.value)} required /></div>
        <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} required /></div>
        <div><Label>Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} required /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Latitude</Label><Input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} /></div>
        <div><Label>Longitude</Label><Input type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} /></div>
        <div><Label>Timezone</Label><Input value={timezone} onChange={e => setTimezone(e.target.value)} /></div>
      </div>
      <Button type="submit">Add Airport</Button>
    </form>
  );
}