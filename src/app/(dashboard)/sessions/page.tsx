// src/app/(dashboard)/sessions/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { authService,UserSession } from '@/services/auth-service';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    authService.getSessions().then(data => {
      console.log("CouchDB Sessions:", data.sessions); // VERIFY DATA HERE
      setSessions(data.sessions || []);
    });
  }, []);
  return (
    <div>
      {sessions.map(s => (
        <div key={s._id}>
          {s.deviceName} - {s.isCurrent ? "Current" : "Remote"}
          {!s.isCurrent && <button onClick={() => authService.revokeSession(s._id)}>Revoke</button>}
        </div>
      ))}
    </div>
  );
}