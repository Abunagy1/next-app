// import { NextRequest, NextResponse } from 'next/server';
// import fs from 'fs/promises';
// import path from 'path';
// import primaryAirportData from '@/app/lib/db/generateForDB/primaryData/airportsData.json';
// import primaryAirplaneData from '@/app/lib/db/generateForDB/primaryData/airplaneData.json';
// import primaryAirlineData from '@/app/lib/db/generateForDB/primaryData/airlinesData.json';
// import {
//   generateAirlineFlightPricesDB,
//   generateAirlinesDB,
//   generateAirplanesDB,
//   generateAirportsDB,
//   generateFlightsDB,
// } from '@/app/lib/db/generateForDB/flights/generateFlights';
// export async function POST(req: NextRequest) {
//   const authHeader = req.headers.get('Authorization');
//   if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//   try {
//     // Generate all data
//     const airport = await generateAirportsDB(primaryAirportData);
//     const { airplaneData: airplane, seatData: seat } = await generateAirplanesDB(primaryAirplaneData);
//     const airline = await generateAirlinesDB(primaryAirlineData);
//     const airlineFlightPrices = await generateAirlineFlightPricesDB(primaryAirlineData);
//     const flight = await generateFlightsDB(10, airport, airplane, airline, airlineFlightPrices);
//     const data = {
//       flight: flight.flat(1),
//       airport,
//       airplane,
//       seat,
//       airline,
//       airlineFlightPrices,
//     };
//     const outDir = path.join(process.cwd(), 'generated', 'flights');
//     await fs.mkdir(outDir, { recursive: true });
//     for (const [key, value] of Object.entries(data)) {
//       await fs.writeFile(
//         path.join(outDir, `${key}.json`),
//         JSON.stringify(value, null, 2)
//       );
//     }
//     console.log('Flights files generated successfully');
//     return NextResponse.json({ success: true, message: 'Flights files generated successfully' });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ success: false, message: 'Error generating flight files' }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import primaryAirportData from '@/app/lib/db/generateForDB/primaryData/airportsData.json';
import primaryAirplaneData from '@/app/lib/db/generateForDB/primaryData/airplaneData.json';
import primaryAirlineData from '@/app/lib/db/generateForDB/primaryData/airlinesData.json';
import {
  generateAirlineFlightPricesDB,
  generateAirlinesDB,
  generateAirplanesDB,
  generateAirportsDB,
  generateFlightsDB,
} from '@/app/lib/db/generateForDB/flights/generateFlights';
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const airport = await generateAirportsDB(primaryAirportData);
    const { airplaneData: airplane, seatData: seat } = await generateAirplanesDB(primaryAirplaneData);
    const airline = await generateAirlinesDB(primaryAirlineData);
    const airlineFlightPrices = await generateAirlineFlightPricesDB(primaryAirlineData);
    const flight = await generateFlightsDB(10, airport, airplane, airline, airlineFlightPrices);
    const data = {
      flight: flight.flat(1),
      airport,
      airplane,
      seat,
      airline,
      airlineFlightPrices,
    };
    const outDir = path.join(process.cwd(), 'generated', 'flights');
    await fs.mkdir(outDir, { recursive: true });
    for (const [key, value] of Object.entries(data)) {
      await fs.writeFile(
        path.join(outDir, `${key}.json`),
        JSON.stringify(value, null, 2)
      );
    }
    console.log('Flights files generated successfully');
    return NextResponse.json({ success: true, message: 'Flights files generated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error generating flight files' }, { status: 500 });
  }
}