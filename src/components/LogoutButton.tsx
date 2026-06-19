'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      router.push('/login');
      router.refresh(); // Clears the server cache
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
    >
      Logout
    </button>
  );
}