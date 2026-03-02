'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Product } from '@/app/lib/definitions';
import styles from './products.module.css';

// Separate component for each product card to manage its own error state
function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = imgError 
    ? '/products/placeholder.jpg' 
    : `/products/${product.image}`;

  return (
    <div className={`${styles.productCard} ${styles[product.type] || ''}`}>
      <h2>{product.name.charAt(0).toUpperCase() + product.name.slice(1)}</h2>
      <div className={styles.price}>${product.price.toFixed(2)}</div>
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 280px"
          priority={false}
          onError={() => setImgError(true)}
        />
      </div>
      <Link
        href={`/store/checkout?productId=${product.id}`}
        className="mt-2 block bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600"
      >
        Buy Now
      </Link>
      <div className={styles.type}>{product.type}</div>
    </div>
  );
}

export default function Products({ initialProducts }: { initialProducts: Product[] }) {
  const { data: session, status } = useSession();
  const [filtered, setFiltered] = useState<Product[]>(initialProducts);
  const [category, setCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let results = initialProducts;
    if (category !== 'All') {
      results = results.filter(p => p.type === category.toLowerCase());
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      results = results.filter(p => p.name.toLowerCase().includes(term));
    }
    setFiltered(results);
  }, [category, searchTerm, initialProducts]);

  if (status === 'loading') {
    return <div className={styles.storeContainer}>Loading...</div>;
  }

  return (
    <div className={styles.storeContainer}>
      <header className={styles.header}>
        <h1>The Store</h1>
      </header>
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="category">Choose a category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All</option>
            <option>Vegetables</option>
            <option>Meat</option>
            <option>Soup</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="search">Enter search term:</label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. beans"
          />
        </div>
      </div>
      <div className={styles.productGrid}>
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#4b5563' }}>
          No products found.
        </p>
      )}
      <footer className={styles.footer}>
        <p>All icons found at the Noun Project:</p>
        <ul>
          <li>Bean can icon by <a href="https://thenounproject.com/yalanis/">Yazmin Alanis</a></li>
          <li>Vegetable icon by <a href="https://thenounproject.com/skatakila/">Ricardo Moreira</a></li>
          <li>Soup icon by <a href="https://thenounproject.com/ArtZ91/">Arthur Shlain</a></li>
          <li>Meat Chunk icon by <a href="https://thenounproject.com/smashicons/">Oliviu Stoian</a></li>
        </ul>
      </footer>
    </div>
  );
}