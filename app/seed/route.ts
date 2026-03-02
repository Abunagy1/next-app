import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users, posts as placeholderPosts, products } from '../lib/placeholder-data';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
//import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  // Create base table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  // Add all optional columns safely
  const columns = [
    { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'image', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'city', type: 'TEXT' },
    { name: 'about', type: 'TEXT' },
    { name: 'birth_date', type: 'DATE' },
    { name: 'role', type: 'VARCHAR(50) DEFAULT \'user\'' },
    { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
  ];
  for (const col of columns) {
    await sql.unsafe(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
    `);
  }
  // Insert default users from placeholder-data.ts
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await sql`
      INSERT INTO users (
        id, name, email, password, email_verified, image, 
        phone, city, about, birth_date, role, created_at, updated_at
      )
      VALUES (
        ${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, 
        ${user.email_verified}, ${user.image || null}, 
        ${user.phone || null}, ${user.city || null}, ${user.about || null}, 
        ${user.birth_date || null}, ${user.role || 'user'}, NOW(), NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('✅ Users seeded');
}
// export async function seedUsers() {
//   await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
//   // Create the base table if it doesn't exist (without new columns)
//   await sql`
//     CREATE TABLE IF NOT EXISTS users (
//       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//       name VARCHAR(255) NOT NULL,
//       email TEXT NOT NULL UNIQUE,
//       password TEXT NOT NULL
//     );
//   `;

//   // Add new columns safely (if they don't exist)
//   await sql`
//     DO $$
//     BEGIN
//       IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
//         ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
//       END IF;
//     END $$;
//   `;
  
//   await sql`
//     DO $$
//     BEGIN
//       IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='image') THEN
//         ALTER TABLE users ADD COLUMN image TEXT;
//       END IF;
//     END $$;
//   `;
  
//   await sql`
//     DO $$
//     BEGIN
//       IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
//         ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
//       END IF;
//     END $$;
//   `;
  
//   await sql`
//     DO $$
//     BEGIN
//       IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
//         ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
//       END IF;
//     END $$;
//   `;
//   // Inside seedUsers() function, after adding other columns:
//   await sql`
//     DO $$
//     BEGIN
//       IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
//         ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
//       END IF;
//     END $$;
//   `;
//   // Insert the default users from placeholder-data.ts
//   for (const user of users) {
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     await sql`
//       INSERT INTO users (id, name, email, password, email_verified, image, created_at, updated_at)
//       VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword}, FALSE, NULL, NOW(), NOW())
//       ON CONFLICT (id) DO NOTHING;
//     `;
//   }
//   console.log('✅ Users seeded');
// }
// Add this function to seed/route.ts
export async function seedPasswordResetTokens() {
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log('✅ Password reset tokens table created');
}
export async function seedCustomers() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;
    await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `;
  for (const customer of customers) {
    await sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('✅ Customers seeded');
}
export async function seedVerificationTokens() {
  await sql`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  // for (const token of tokens) {
  //   await sql`
  //     INSERT INTO verification_tokens (id, user_id, token, expires)
  //     VALUES (${token.id}, ${token.user_id}, ${token.token}, ${token.expires})
  //     ON CONFLICT (id) DO NOTHING;
  //   `;
  // }
  console.log('✅ Verification tokens table created');
}

export async function seedInvoices() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;
  // Add new columns safely
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='items') THEN
        ALTER TABLE invoices ADD COLUMN items JSONB;
      END IF;
    END $$;
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='shipping_info') THEN
        ALTER TABLE invoices ADD COLUMN shipping_info JSONB;
      END IF;
    END $$;
  `;
  
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_intent_id') THEN
        ALTER TABLE invoices ADD COLUMN payment_intent_id TEXT;
      END IF;
    END $$;
  `;
  // Add payment_method and payment_reference columns
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_method') THEN
        ALTER TABLE invoices ADD COLUMN payment_method TEXT;
      END IF;
    END $$;
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_reference') THEN
        ALTER TABLE invoices ADD COLUMN payment_reference TEXT;
      END IF;
    END $$;
  `;
  // Insert seed data (unchanged)
  for (const invoice of invoices) {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('✅ Invoices seeded');
}


export async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
  for (const rev of revenue) {
    await sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `;
  }
  console.log('✅ Revenue seeded');
}
export async function seedPosts() {
  // Ensure default user exists
  const defaultUser = users[0];
  const hashedPassword = await bcrypt.hash(defaultUser.password, 10);
  await sql`
    INSERT INTO users (id, name, email, password)
    VALUES (${defaultUser.id}, ${defaultUser.name}, ${defaultUser.email}, ${hashedPassword})
    ON CONFLICT (id) DO NOTHING;
  `;
  // Create posts table (if not exists) without images initially
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `;
  // Add images column if it doesn't exist
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='images') THEN
        ALTER TABLE posts ADD COLUMN images TEXT[];
      END IF;
    END $$;
  `;
  // Insert placeholder posts (from placeholder-data.ts)
  for (const post of placeholderPosts) {
    await sql`
      INSERT INTO posts (slug, user_id, title, content, created_at, updated_at, images)
      VALUES (${post.slug}, ${post.user_id}, ${post.title}, ${post.content}, ${post.created_at}, ${post.updated_at}, NULL)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updated_at = EXCLUDED.updated_at;
    `;
  }
  // Insert markdown posts (from app/content/posts)
  const postsDirectory = path.join(process.cwd(), 'app/content/posts');
  if (fs.existsSync(postsDirectory)) {
    const fileNames = fs.readdirSync(postsDirectory);
    for (const fileName of fileNames) {
      if (!fileName.endsWith('.md')) continue;
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      await sql`
        INSERT INTO posts (slug, user_id, title, content, created_at, updated_at, images)
        VALUES (${slug}, ${defaultUser.id}, ${data.title}, ${content}, ${data.date}, ${data.date}, NULL)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = EXCLUDED.updated_at;
      `;
    }
  }
  console.log('✅ Posts seeded');
}
export async function seedProducts() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      image VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  for (const product of products) {
    await sql`
      INSERT INTO products (name, price, image, type)
      VALUES (${product.name}, ${product.price}, ${product.image}, ${product.type})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log('✅ Products seeded');
}
export async function GET() {
  try {
    // Run in correct order (users first, then posts)
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    await seedPosts();
    await seedVerificationTokens();
    await seedProducts();
    await seedPasswordResetTokens();
    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('❌ Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}