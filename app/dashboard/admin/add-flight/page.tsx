import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import AddFlightForm from './AddFlightForm';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

export const dynamic = 'force-dynamic';

export default async function AddFlightPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') redirect('/dashboard');

  // Fetch airlines, airports, airplanes for the form
  let airlines: any[] = [];
  let airports: any[] = [];
  let airplanes: any[] = [];

  if (dbType === 'postgres') {
    const [a1, a2, a3] = await Promise.all([
      sql`SELECT iata_code, name FROM airlines ORDER BY name`,
      sql`SELECT iata_code, name, city FROM airports ORDER BY city`,
      sql`SELECT id, model, classes, seats FROM airplanes ORDER BY model`
    ]);
    airlines = a1.map((r :any) => ({ iataCode: r.iata_code, name: r.name }));
    airports = a2.map((r :any) => ({ iataCode: r.iata_code, name: r.name, city: r.city }));
    airplanes = a3.map((r :any) => ({
      id: r.id,
      model: r.model,
      classes: r.classes,
      seats: r.seats, // JSONB, will be parsed later
    }));
  } else {
    await connectDB();
    const [a1, a2, a3] = await Promise.all([
      dataModels.Airline.find().sort('name').lean(),
      dataModels.Airport.find().sort('city').lean(),
      dataModels.Airplane.find().sort('model').lean()
    ]);
    airlines = a1.map(r => ({ iataCode: r.iataCode, name: r.name }));
    airports = a2.map(r => ({ iataCode: r.iataCode, name: r.name, city: r.city }));
    airplanes = a3.map(r => ({
      id: r._id.toString(),
      model: r.model,
      classes: r.classes,
      seats: r.seats,
    }));
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Flight</h1>
      <AddFlightForm airlines={airlines} airports={airports} airplanes={airplanes} />
    </div>
  );
}