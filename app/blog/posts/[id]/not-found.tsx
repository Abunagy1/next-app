import Link from 'next/link';
import Layout from '@/components/layout';
export const dynamic = 'force-dynamic';
export default function NotFound() {
  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          Return Home
        </Link>
      </div>
    </Layout>
  );
}