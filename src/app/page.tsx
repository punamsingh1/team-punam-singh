'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // API-First Logic: We check if a session exists in the store
    // For Web, the cookie is sent automatically.
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me'); // A simple endpoint to check token
        if (res.ok) {
          router.replace('/dashboard');
        } else {
          router.replace('/register'); // Ttteeee Flow: Send new users to Register
        }
      } catch {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse text-center">
          Ttteeee Identity System<br/>
          <span className="text-xs font-mono uppercase">Initializing Secure Handshake...</span>
        </p>
      </div>
    </div>
  );
}