// app/seed/route.ts
import { NextResponse } from 'next/server';
import { dbType, connectDB } from '@/app/lib/db/index';
import { seedPostgres } from './seed-postgres';
import { seedMongoDB } from './seed-mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    if (dbType === 'postgres') {
      await seedPostgres();
    } else {
      await connectDB();
      await seedMongoDB();
    }
    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('❌ Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}