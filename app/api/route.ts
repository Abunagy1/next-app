// app/api/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'API is working' });
}
// export async function GET() {
//   const data = await getData();
//   return new Response(JSON.stringify(data), {
//     headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' },
//   });
// }
// Optional: add other methods
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}