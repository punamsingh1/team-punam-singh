// types/database.ts
import type { MaybeDocument  } from 'nano';

export interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

// This line is the most important for scalability
export interface UserDocument extends UserProfile, MaybeDocument {
  _id: string;
  _rev: string;
}