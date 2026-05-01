'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uiStatus, setUiStatus] = useState<Status>('loading');
  const [uiMessage, setUiMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    const controller = new AbortController();

    // 1. Handle missing token immediately using queueMicrotask to avoid sync render errors
    if (!token) {
      queueMicrotask(() => {
        setUiStatus('error');
        setUiMessage('No verification token found. Check your email link.');
      });
      return;
    }

    // 2. Define the verify function
    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`, {
          signal: controller.signal,
        });

        const data = (await res.json()) as { message?: string };

        if (res.ok) {
          setUiStatus('success');
          setUiMessage(data.message || 'Email verified! Redirecting to login...');
          setTimeout(() => router.push('/login'), 2000);
        } else {
          setUiStatus('error');
          setUiMessage(data.message || 'Verification failed.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setUiStatus('error');
        setUiMessage('Connection error. Please try again.');
      }
    };

    verify();

    // 3. Cleanup on unmount
    return () => controller.abort();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-100 text-center">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Email Verification</h1>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest">
            TTTEEEE Security Protocol
          </p>
        </header>

        {/* Loading State */}
        {uiStatus === 'loading' && (
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">{uiMessage}</p>
          </div>
        )}

        {/* Success State */}
        {uiStatus === 'success' && (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-semibold">{uiMessage}</p>
            <p className="text-sm text-gray-400">Redirecting to login in 2 seconds...</p>
          </div>
        )}

        {/* Error State */}
        {uiStatus === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-700 font-semibold">{uiMessage}</p>
            <Link
              href="/login"
              className="inline-block mt-2 text-blue-600 font-bold hover:underline text-sm"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Default export wrapped in Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}