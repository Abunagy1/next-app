// app/store/page.tsx
import ProductsClient from '@/app/ui/store/products';
import { Product } from '@/app/lib/definitions';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import ProductModel from '@/app/lib/db/models/Product';
export const dynamic = 'force-dynamic';
export default async function StorePage() {
  let productsArray: Product[];
  if (dbType === 'postgres') {
    const rows = await sql<Product[]>`SELECT * FROM products ORDER BY name`;
    productsArray = rows.map((row: { id: string; name: string; price: number; image: string; type: string }) => ({
      ...row,
      price: typeof row.price === 'number' ? row.price : Number(row.price)
    }));
  } else {
    await connectDB();
    const docs = await ProductModel.find().sort('name').lean();
    productsArray = docs.map((doc: { _id: any; name: string; price: number; image: string; type: string }) => ({
      id: doc._id.toString(),
      name: doc.name,
      price: doc.price,
      image: doc.image,
      type: doc.type,
    }));
  }
  return <ProductsClient initialProducts={productsArray} />;
}