'use client';
import { useState, useEffect, useMemo } from 'react'; // add useMemo
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Product } from '@/app/lib/definitions';
import styles from './products.module.css';
function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
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
          priority={priority}
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
  const [category, setCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  // Compute filtered products using useMemo
  const filtered = useMemo(() => {
    let results = initialProducts;
    if (category !== 'All') {
      results = results.filter(p => p.type === category.toLowerCase());
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      results = results.filter(p => p.name.toLowerCase().includes(term));
    }
    return results;
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
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index === 0} />
          ))}
        </div>
      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#4b5563' }}>
          No products found.
        </p>
      )}
      <footer className="text-center mt-8 border-t-2 border-black dark:border-white pt-4">
        <div className="flex justify-center space-x-6 mb-2">
          {/* GitHub */}
          <a
            href="https://github.com/Abungy1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/mohamed.nagy.378199"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Facebook"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          {/* Twitter/X */}
          <a
            href="https://twitter.com/your-username"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Twitter"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/mohamed-nagy-18a30414a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="LinkedIn"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>

          {/* Personal Website / Portfolio */}
          <a
            href="https://your-website.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Website"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 3v18M3 12h18"/></svg>
          </a>
        </div>
        <p className="text-xs text-black/60 dark:text-white/60">
          &copy; {new Date().getFullYear()} GoBye. All rights reserved.
        </p>
      </footer>
    </div>
  );
}