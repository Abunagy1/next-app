import { NextRequest, NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';

const defaultConfig = {
  maintenanceMode: {
    enabled: false,
    message: 'Site is under maintenance.',
    startsAt: null,
    endsAt: null,
    type: 'full',
    affectedFeatures: [],
    allowlistedRoutes: ['/privacy-policy', '/terms-of-service', '/contact-us', '/support'],
    reason: '',
  },
  enableFlightBooking: true,
  enableHotelBooking: true,
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (dbType === 'postgres') {
      await sql`
        INSERT INTO website_config (id, maintenance_mode, enable_flight_booking, enable_hotel_booking, updated_at)
        VALUES (1, ${JSON.stringify(defaultConfig.maintenanceMode)}::jsonb, ${defaultConfig.enableFlightBooking}, ${defaultConfig.enableHotelBooking}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          maintenance_mode = EXCLUDED.maintenance_mode,
          enable_flight_booking = EXCLUDED.enable_flight_booking,
          enable_hotel_booking = EXCLUDED.enable_hotel_booking,
          updated_at = NOW()
      `;
    } else {
      await connectDB();
      await dataModels.WebsiteConfig.deleteMany({});
      await dataModels.WebsiteConfig.create(defaultConfig);
    }

    return NextResponse.json({ success: true, message: 'Website config uploaded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error uploading website config' }, { status: 500 });
  }
}