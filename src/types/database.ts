// src/types/database.ts
import type { MaybeDocument } from 'nano';

export interface VerificationToken {
  _id: string;      
  _rev: string;
  token: string;
  email: string;
  expires: string;
}

export interface User {
  _id: string;      
  _rev: string;
  email: string;
  status: 'PENDING' | 'ACTIVE';
  emailVerified?: string;
}

// These are the types you MUST import in your route.ts
export type VerificationTokenDocument = VerificationToken & MaybeDocument;
export type UserDocument = User & MaybeDocument;