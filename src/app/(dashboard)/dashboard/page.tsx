import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

interface DashboardData {
  name: string;
  email: string;
  status: string;
  lastSync: string;
  system: string;
}

export default async function DashboardPage() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/login?error=session_expired');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let data: DashboardData | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: `accessToken=${token}` },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      data = json.data as DashboardData;
    }
  } catch (error: unknown) {
    console.error("📊 Dashboard Fetch Error:", error);
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-red-500">
        <div className="text-center p-8 border border-red-100 bg-red-50 rounded-2xl shadow-sm">
          <p className="text-xl font-bold">⚠️ Connection Failure</p>
          <p className="text-sm opacity-80">Unable to reach CouchDB services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* --- CLEAN TOP NAV --- */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-200">
              S
            </div>
            <span className="font-bold tracking-tight text-slate-900 text-lg uppercase">
               <span className="text-blue-600">TvaNosh</span>
            </span>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* --- HEADER --- */}
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">App </h1>
          <p className="text-slate-500 mt-1 text-lg">Identity Management Dashboard</p>
        </header>

        {/* --- CONTENT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Identity Card */}
          <div className="md:col-span-2 bg-slate-50 rounded-3xl p-10 border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <h2 className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-6">Verified User</h2>
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                {data.name.charAt(0)}
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{data.name}</p>
                <p className="text-slate-500 font-medium text-lg">{data.email}</p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
            <h2 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">System Load</h2>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <p className="text-2xl font-bold text-slate-900">{data.status}</p>
            </div>
            <div className="pt-6 border-t border-slate-50">
               <p className="text-slate-400 text-xs font-bold uppercase mb-1">Last Sync</p>
               <p className="text-slate-700 text-sm">{new Date(data.lastSync).toLocaleString()}</p>
            </div>
          </div>

        </div>

        {/* --- SYSTEM FOOTER --- */}
        <footer className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400">
           <div className="text-xs font-bold tracking-widest uppercase flex gap-6">
            <span><span className="text-slate-900"></span></span>
              <span><span className="text-slate-900 italic"></span></span>
           </div>
           
        </footer>
      </main>
    </div>
  );
}