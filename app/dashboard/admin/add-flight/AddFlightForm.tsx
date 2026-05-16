'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addFlightAction } from '@/app/lib/actions/admin-actions';
import { toast } from 'sonner';

interface AddFlightFormProps {
  airlines: { iataCode: string; name: string }[];
  airports: { iataCode: string; name: string; city: string }[];
  airplanes: { id: string; model: string; classes: string[]; seats: any }[];
}

export default function AddFlightForm({ airlines, airports, airplanes }: AddFlightFormProps) {
  const router = useRouter();
  const [airline, setAirline] = useState('');
  const [depAirport, setDepAirport] = useState('');
  const [arrAirport, setArrAirport] = useState('');
  const [airplaneId, setAirplaneId] = useState('');
  const [flightCode, setFlightCode] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('airline', airline);
    formData.append('depAirport', depAirport);
    formData.append('arrAirport', arrAirport);
    formData.append('airplaneId', airplaneId);
    formData.append('flightCode', flightCode);
    formData.append('departureDate', departureDate);
    formData.append('departureTime', departureTime);

    const res = await addFlightAction(formData);
    if (res?.success) {
      toast.success('Flight added successfully');
      router.push('/dashboard');
    } else {
      toast.error(res?.message || 'Failed to add flight');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Airline</Label>
        <Select value={airline} onValueChange={setAirline}>
          <SelectTrigger><SelectValue placeholder="Select airline" /></SelectTrigger>
          <SelectContent>
            {airlines.map(a => <SelectItem key={a.iataCode} value={a.iataCode}>{a.name} ({a.iataCode})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Departure Airport</Label>
          <Select value={depAirport} onValueChange={setDepAirport}>
            <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
            <SelectContent>
              {airports.map(a => <SelectItem key={a.iataCode} value={a.iataCode}>{a.city} ({a.iataCode})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Arrival Airport</Label>
          <Select value={arrAirport} onValueChange={setArrAirport}>
            <SelectTrigger><SelectValue placeholder="To" /></SelectTrigger>
            <SelectContent>
              {airports.map(a => <SelectItem key={a.iataCode} value={a.iataCode}>{a.city} ({a.iataCode})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Airplane</Label>
        <Select value={airplaneId} onValueChange={setAirplaneId}>
          <SelectTrigger><SelectValue placeholder="Select airplane" /></SelectTrigger>
          <SelectContent>
            {airplanes.map(a => <SelectItem key={a.id} value={a.id}>{a.model} ({a.classes.join(', ')})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Flight Code</Label>
        <Input value={flightCode} onChange={(e) => setFlightCode(e.target.value)} placeholder="e.g., EK123" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Departure Date</Label>
          <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required />
        </div>
        <div>
          <Label>Departure Time (local)</Label>
          <Input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required />
        </div>
      </div>
      <Button type="submit">Add Flight</Button>
    </form>
  );
}