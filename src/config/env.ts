// src/config/env.ts
import { z } from "zod";

// FIX: Schema now matches your actual .env variables (CouchDB + JWT)
// REMOVED: DATABASE_URL, NEXTAUTH_SECRET (you don't have these)
// ADDED:   COUCHDB_URL, COUCHDB_USER, COUCHDB_PASSWORD, JWT_ACCESS_SECRET
const schema = z.object({
  COUCHDB_URL: z.string().url().default("http://127.0.0.1:5984"),
  COUCHDB_USER: z.string().min(1, "COUCHDB_USER is required"),
  COUCHDB_PASSWORD: z.string().min(1, "COUCHDB_PASSWORD is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  MAIL_HOST: z.string().default("localhost"),
  MAIL_PORT: z.coerce.number().default(1025),
});

export const env = schema.parse({
  COUCHDB_URL:        process.env.COUCHDB_URL,
  COUCHDB_USER:       process.env.COUCHDB_USER,
  COUCHDB_PASSWORD:   process.env.COUCHDB_PASSWORD,
  JWT_ACCESS_SECRET:  process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  MAIL_HOST:          process.env.MAIL_HOST,
  MAIL_PORT:          process.env.MAIL_PORT,
});