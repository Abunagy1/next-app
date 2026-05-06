// app/store/edit/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import AdminProducts from '@/app/ui/admin/products-admin';
import { Product } from '@/app/lib/definitions';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import ProductModel from '@/app/lib/db/models/Product';
export const dynamic = 'force-dynamic';
export default async function StoreEditPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    redirect('/store');
  }
  let products: Product[];
  if (dbType === 'postgres') {
    const rows = await sql<Product[]>`SELECT * FROM products ORDER BY name`;
    products = rows.map((row: { id: string; name: string; price: number; image: string; type: string }) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      image: row.image,
      type: row.type,
    }));
  } else {
    await connectDB();
    const docs = await ProductModel.find().sort('name').lean();
    products = docs.map(doc => ({
      id: doc._id.toString(),
      name: doc.name,
      price: doc.price,
      image: doc.image,
      type: doc.type,
    }));
  }
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Products</h1>
      <AdminProducts products={products} />
    </div>
  );
}