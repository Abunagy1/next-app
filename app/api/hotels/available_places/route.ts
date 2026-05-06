import { NextRequest, NextResponse } from "next/server";
import { dbType, sql } from "@/app/lib/db/index";
import dataModels from "@/app/lib/db/models";

interface AvailablePlace {
  city: string;
  country: string;
  type: string;
}

type CityCountryRow = { city: string; country: string };

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("searchQuery") || '';
  try {
    if (dbType === "mongodb") {
      const places = await getAvailablePlacesMongo(searchQuery, limit);
      return NextResponse.json({
        success: true,
        message: "Available places fetched successfully",
        data: places,
      });
    } else {
      const places = await getAvailablePlacesPostgres(searchQuery, limit);
      return NextResponse.json({
        success: true,
        message: "Available places fetched successfully",
        data: places,
      });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Error getting available places" },
      { status: 500 }
    );
  }
}
// async function getAvailablePlacesMongo(searchQuery: string, limit: number) {
//   const { Hotel } = dataModels;
//   const filter: any = {};
//   if (searchQuery) {
//     const regex = new RegExp(searchQuery, 'i');
//     filter.$or = [{ 'address.city': regex }, { 'address.country': regex }];
//   }
//   const hotels = await Hotel.find(filter).limit(limit).select('address -_id').lean();
//   return hotels.map((hotel: any) => ({
//     city: hotel.address?.city || '',
//     country: hotel.address?.country || '',
//     type: 'place',
//   })).filter(p => p.city && p.country);
// }

async function getAvailablePlacesMongo(
  searchQuery: string,
  limit: number
): Promise<AvailablePlace[]> {
  const { Hotel } = dataModels;
  if (!searchQuery || searchQuery.trim() === "") {
    const hotels = await Hotel.find({})
      .limit(limit)
      .select("address -_id")
      .lean();

    return hotels.map((hotel: any) => ({
      city: hotel.address.city,
      country: hotel.address.country,
      type: "place",
    }));
  }
  const searchLower = searchQuery.toLowerCase().trim();
  const hotels = await Hotel.find({
    $or: [
      { "address.city": { $regex: searchLower, $options: "i" } },
      { "address.country": { $regex: searchLower, $options: "i" } },
    ],
  })
    .limit(limit)
    .select("address -_id")
    .lean();
  const seen = new Set<string>();
  const uniquePlaces: AvailablePlace[] = [];
  for (const hotel of hotels) {
    const key = `${hotel.address.city}|${hotel.address.country}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePlaces.push({
        city: hotel.address.city,
        country: hotel.address.country,
        type: "place",
      });
    }
  }
  return uniquePlaces;
}

async function getAvailablePlacesPostgres(
  searchQuery: string,
  limit: number
): Promise<AvailablePlace[]> {
  if (!searchQuery || searchQuery.trim() === '') {
    const rows = await sql<CityCountryRow>`
      SELECT DISTINCT
        COALESCE(address->>'city', '') as city,
        COALESCE(address->>'country', '') as country
      FROM hotels
      WHERE address IS NOT NULL
        AND address->>'city' IS NOT NULL
        AND address->>'country' IS NOT NULL
      LIMIT ${limit}
    `;
    return rows.map((row: CityCountryRow) => ({
      city: row.city,
      country: row.country,
      type: "place",
    }));
  }
  const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `%${escaped}%`;
  const rows = await sql<CityCountryRow>`
      SELECT DISTINCT
        COALESCE(address->>'city', '') as city,
        COALESCE(address->>'country', '') as country
      FROM hotels
      WHERE address IS NOT NULL
        AND (
          address->>'city' ILIKE ${pattern}
          OR address->>'country' ILIKE ${pattern}
        )
      LIMIT ${limit}
    `;
  return rows.map((row: CityCountryRow) => ({
    city: row.city,
    country: row.country,
    type: "place",
  }));
}
// another form (same as above )
// Inside the GET function, for PostgreSQL branch:
// if (dbType === 'postgres') {
//   let rows;
//   if (!searchQuery || searchQuery.trim() === '') {
//     rows = await sql`
//       SELECT DISTINCT
//         COALESCE(address->>'city', '') as city,
//         COALESCE(address->>'country', '') as country
//       FROM hotels
//       WHERE address IS NOT NULL
//         AND address->>'city' IS NOT NULL
//         AND address->>'country' IS NOT NULL
//       LIMIT ${limit}
//     `;
//   } else {
//     const pattern = `%${searchQuery}%`;
//     rows = await sql`
//       SELECT DISTINCT
//         COALESCE(address->>'city', '') as city,
//         COALESCE(address->>'country', '') as country
//       FROM hotels
//       WHERE address IS NOT NULL
//         AND (
//           address->>'city' ILIKE ${pattern}
//           OR address->>'country' ILIKE ${pattern}
//         )
//       LIMIT ${limit}
//     `;
//   }
//   return NextResponse.json({ success: true, data: rows });
// }