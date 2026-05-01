// src/app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

// Define the interface to match exactly what your API returns
interface DashboardData {
  name: string;
  email: string;
  status: string;
  lastSync: string;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  // 1. Redirect if no token found
  if (!token) {
    redirect('/login?error=session_expired');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // 2. Fetch Data
  const res = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { 
      Cookie: `accessToken=${token}` // This sends the auth cookie to your API
    },
    cache: 'no-store',
  });

  // 3. Handle Unauthorized
  if (res.status === 401) {
    redirect('/login?error=unauthorized');
  }

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const json = await res.json();
  
  // FIX: Access the data correctly. 
  
  const data: DashboardData = json.data || json; 

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="border-b border-slate-100 p-6 flex justify-between items-center">
        <h1 className="font-bold text-blue-600 uppercase">TvaNosh</h1>
        <LogoutButton />
      </nav>

      <main className="max-w-5xl mx-auto p-12">
        <h1 className="text-4xl font-black mb-12">Dashboard</h1>
        
        {/* Safely render data */}
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