'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100vw',
                background: '#000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            <div style={{ maxWidth: '720px', width: '100%' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
                    Something went wrong
                </h1>
                <p style={{ opacity: 0.8, marginBottom: '16px' }}>
                    {error?.message || 'An unexpected error occurred.'}
                </p>
                {error?.digest && (
                    <p style={{ opacity: 0.5, fontSize: '12px', marginBottom: '16px' }}>
                        Error ID: {error.digest}
                    </p>
                )}
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '10px 20px',
                        background: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
