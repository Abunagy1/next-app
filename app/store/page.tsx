import postgres from 'postgres';
//import ProductsClient from '../ui/store/products';
import ProductsClient from '@/app/ui/store/products';
import { Product } from '@/app/lib/definitions';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export default async function StorePage() {
  const rows = await sql<Product[]>`SELECT * FROM products ORDER BY name`;
  // Convert price to number (Postgres returns numeric as string by default)
  const productsArray = rows.map(row => ({
    ...row,
    price: typeof row.price === 'number' ? row.price : Number(row.price)
  }));
  return <ProductsClient initialProducts={productsArray} />;
}