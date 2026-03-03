// import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import AdminProducts from '@/app/ui/admin/products-admin';
import { Product } from '@/app/lib/definitions';
export const dynamic = 'force-dynamic';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export default async function StoreEditPage() {
  //const session = await auth();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    redirect('/store');
  }
  const rows = await sql<Product[]>`SELECT * FROM products ORDER BY name`;
  // Ensure the rows are properly typed as Product[]
  const products: Product[] = rows.map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    image: row.image,
    type: row.type,
  }));
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Products</h1>
      <AdminProducts products={products} />
    </div>
  );
}