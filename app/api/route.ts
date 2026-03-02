// app/api/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API is working' });
}

// Optional: add other methods
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}