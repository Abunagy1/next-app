// Router Handler, app/query/route.ts, to query the database.
import postgres from 'postgres';
//import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
async function listInvoices() {
	const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;
	return data;
}
export async function GET() {
//   return Response.json({
//     message:
//       'Uncomment this file and remove this line. You can delete this file when you are finished.',
//   });
  try {
    const rows = await sql`SELECT slug, title FROM posts`;
    const invoices = await listInvoices();
    return NextResponse.json({ rows, invoices });
    //return Response.json(await listInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}