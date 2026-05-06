import { NextRequest, NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = Number(searchParams.get('limit')) || 10;
  const searchQuery = searchParams.get('searchQuery') || '';

  try {
    if (dbType === 'postgres') {
      let query = sql<{ iataCode: string; name: string; city: string }[]>`
        SELECT iata_code AS "iataCode", name, city FROM airports LIMIT ${limit}
      `;
      if (searchQuery) {
        const pattern = `%${searchQuery}%`;
        query = sql`
          SELECT iata_code AS "iataCode", name, city FROM airports
          WHERE iata_code ILIKE ${pattern}
             OR name ILIKE ${pattern}
             OR city ILIKE ${pattern}
          LIMIT ${limit}
        `;
      }
      const rows = await query;
      return NextResponse.json({ success: true, data: rows });
    } else {
      await connectDB();
      let query = dataModels.Airport.find().limit(limit).select('iataCode name city');
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i');
        query = query.or([
          { iataCode: regex },
          { name: regex },
          { city: regex },
        ]);
      }
      const docs = await query.lean();
      const data = docs.map(doc => ({
        iataCode: doc.iataCode,
        name: doc.name,
        city: doc.city,
      }));
      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('[available_airports] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching airports' },
      { status: 500 }
    );
  }
}