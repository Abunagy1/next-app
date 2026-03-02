// app/blog/posts/[id]/error.tsx
'use client';
import { useEffect } from 'react';
import Link from 'next/link';
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong loading this post!</h2>
            <p>{error.message}</p>
            <div style={{ marginTop: '1rem' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        marginRight: '1rem',
                        padding: '0.5rem 1rem',
                        background: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Try again
                </button>
                <Link
                    href="/blog"
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#f0f0f0',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        textDecoration: 'none',
                    }}
                >
                    Back to Blog
                </Link>
            </div>
        </div>
    );
}