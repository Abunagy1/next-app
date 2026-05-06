// app/query/route.ts
import { NextResponse } from 'next/server';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import PostModel from '@/app/lib/db/models/Post';
import InvoiceModel from '@/app/lib/db/models/Invoice';
async function listInvoices() {
  if (dbType === 'postgres') {
    const data = await sql`
      SELECT invoices.amount, customers.name
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE invoices.amount = 666;
    `;
    return data;
  } else {
    await connectDB();
    const invoices = await InvoiceModel.find({ amount: 666 })
      .populate('customer.id', 'name')
      .lean();
    return invoices.map(inv => ({
      amount: inv.amount,
      name: inv.customer.name,
    }));
  }
}
export async function GET() {
  try {
    let rows;
    if (dbType === 'postgres') {
      rows = await sql`SELECT slug, title FROM posts`;
    } else {
      await connectDB();
      const posts = await PostModel.find().lean();
      rows = posts.map(p => ({ slug: p.slug, title: p.title }));
    }
    const invoices = await listInvoices();
    return NextResponse.json({ rows, invoices });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}