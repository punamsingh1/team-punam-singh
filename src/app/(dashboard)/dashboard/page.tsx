'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { getAccessToken, setAccessToken } from '@/lib/token-store';
import LogoutButton from '@/components/LogoutButton';

interface DashboardData {
  name: string;
  email: string;
  status: string;
  lastSync: string;
  system: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // ADDED: if no accessToken in memory, refresh first using cookie
        if (!getAccessToken()) {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (!refreshRes.ok) {
            router.push('/login?error=session_expired');
            return;
          }

          const refreshData = await refreshRes.json() as { accessToken: string };
          setAccessToken(refreshData.accessToken);
        }

        const res = await apiFetch('/api/dashboard');

        if (res.status === 401) {
          router.push('/login?error=unauthorized');
          return;
        }

        const json = await res.json() as { data: DashboardData };
        setData(json.data);

      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available.</div>;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="border-b border-slate-100 p-6 flex justify-between items-center">
        <h1 className="font-bold text-blue-600 uppercase">TvaNosh</h1>
        <LogoutButton />
      </nav>
      <main className="max-w-5xl mx-auto p-12">
        <h1 className="text-4xl font-black mb-12">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-slate-50 p-10 rounded-3xl">
            <p className="text-sm text-slate-400 uppercase font-bold">User</p>
            <p className="text-3xl font-bold">{data.name}</p>
            <p className="text-slate-500">{data.email}</p>
          </div>
          <div className="bg-white border p-10 rounded-3xl">
            <p className="text-sm text-slate-400 uppercase font-bold">Status</p>
            <p className="text-2xl font-bold">{data.status}</p>
          </div>
        </div>
      </main>
    </div>
  );
}