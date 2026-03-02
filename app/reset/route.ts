import { NextResponse } from 'next/server';
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
import { seedUsers, seedCustomers, seedInvoices, seedRevenue, seedPosts, seedVerificationTokens, seedProducts, seedPasswordResetTokens } from '@/app/seed/route'; // You'll need to export these functions separately
export async function GET() {
  try {

    // TO Ensure password_reset_tokens table exists (for deletion)
    // await sql`
    //   CREATE TABLE IF NOT EXISTS password_reset_tokens (
    //     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    //     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    //     token TEXT NOT NULL UNIQUE,
    //     expires TIMESTAMP NOT NULL,
    //     created_at TIMESTAMP DEFAULT NOW()
    //   );
    // `;
    // OR you can comment out any line never been created before delted
    await sql`DELETE FROM password_reset_tokens`;
    await sql`DELETE FROM verification_tokens;`;
    await sql`DELETE FROM posts;`;
    await sql`DELETE FROM invoices;`;
    await sql`DELETE FROM customers;`;
    await sql`DELETE FROM revenue;`;
    await sql`DELETE FROM users;`;
    await sql`DELETE FROM products;`;
    
    // Re‑seed
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    await seedPosts();
    await seedVerificationTokens();
    await seedProducts();
    await seedPasswordResetTokens();
    return NextResponse.json({ message: 'Database reset and seeded successfully.' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}