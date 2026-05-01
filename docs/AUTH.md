# Identity System Documentation

## How it Works
This system is built to be "API-First," meaning the logic is separate from the database. 

### 1. Security
* **Passwords:** We don't store plain passwords. We use **Bcrypt** to scramble them before they go into the database.
* **Sessions:** We use **JWT** (JSON Web Tokens) to keep users logged in securely.

### 2. Database (CouchDB)
We use CouchDB to store:
* User profiles
* Hashed passwords
* Active session data

### 3. Current Status & Pending Work
* ✅ **CouchDB Integration:** Done.
* ✅ **Bcrypt/JWT Security:** Done.
* ✅ **Documentation:** Done.
* ⏳ **Email (MailDev):** The infrastructure is ready in Docker. I am currently finishing the final connection to send the "Verification Link" to the MailDev inbox.






//////////////////////////////////////////// 1.may-2026-project fl/////////////////////////////////////////////////




# TTTEEEE Identity System

> A production-ready, API-first authentication system built with **Next.js 15**, **CouchDB**, and **JWT**. Designed as a standalone auth module you can drop into any project.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Auth Flow](#auth-flow)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Overview

TTTEEEE Identity System handles the full authentication lifecycle:

- **Register** — create an account with email + password
- **Verify** — confirm identity via email link (MailDev in dev, SMTP in production)
- **Login** — receive a short-lived access token + long-lived refresh token
- **Refresh** — silently renew access tokens without re-login
- **Protected routes** — `/api/auth/me` validates the current session

Users remain `PENDING` until they click the verification link. Only verified users receive a `ACTIVE` status and can log in.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 15 App                    │
│                                                     │
│  ┌──────────────┐        ┌──────────────────────┐   │
│  │   Frontend   │        │     API Routes       │   │
│  │              │        │                      │   │
│  │  /register   │──────▶ │  POST /auth/register │   │
│  │  /login      │──────▶ │  POST /auth/login    │   │
│  │  /verify-email│─────▶ │  GET  /auth/verify-  │   │
│  │              │        │       email          │   │
│  └──────────────┘        │  POST /auth/refresh  │   │
│                          │  GET  /auth/me       │   │
│                          └──────────┬───────────┘   │
└─────────────────────────────────────┼───────────────┘
                                      │
              ┌───────────────────────┼──────────────┐
              │                       │              │
       ┌──────▼──────┐   ┌───────────▼───┐  ┌───────▼──────┐
       │   CouchDB   │   │   MailDev     │  │     JWT      │
       │             │   │  (dev email)  │  │              │
       │  users      │   │  localhost    │  │ Access  15m  │
       │  sessions   │   │  :1080/:1025  │  │ Refresh  7d  │
       │  verify-    │   └───────────────┘  └──────────────┘
       │  tokens     │
       └─────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Database | CouchDB + nano | Document store for users, sessions, tokens |
| Auth | JWT (jsonwebtoken) | Stateless access + refresh tokens |
| Password | bcryptjs | Secure password hashing |
| Validation | Zod | Runtime environment variable validation |
| Email (dev) | MailDev | Local SMTP server + inbox UI |
| Email (prod) | Nodemailer + SMTP | Production email delivery |
| Language | TypeScript | Full type safety |
| Package manager | pnpm | Fast, disk-efficient installs |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Auth UI pages (route group)
│   │   ├── register/
│   │   │   └── page.tsx            # Registration form
│   │   ├── login/
│   │   │   └── page.tsx            # Login form
│   │   └── verify-email/
│   │       └── page.tsx            # Email verification landing page
│   │
│   └── api/
│       └── auth/
│           ├── register/
│           │   └── route.ts        # POST — create user + save token
│           ├── login/
│           │   └── route.ts        # POST — verify credentials + issue JWT
│           ├── verify-email/
│           │   └── route.ts        # GET + POST — activate account
│           ├── refresh/
│           │   └── route.ts        # POST — issue new access token
│           └── me/
│               └── route.ts        # GET — return current user
│
├── config/
│   └── env.ts                      # Central Zod-validated env config
│
├── lib/
│   ├── couchdb.ts                  # CouchDB connection + DB handles
│   ├── mail-utils.ts               # Email sending (MailDev / SMTP)
│   └── api-client.ts               # fetchWithAuth — auto token refresh
│
└── types/
    └── database.ts                 # TypeScript interfaces for DB documents
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- CouchDB running locally ([download](https://couchdb.apache.org/))

### 1. Clone and install

```bash
git clone https://github.com/your-username/ttteeee-identity.git
cd ttteeee-identity
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values — see [Environment Variables](#environment-variables) below.

### 3. Start CouchDB

```bash
# macOS
brew services start couchdb

# Docker
docker run -d --name couchdb -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=admin123 \
  couchdb:latest

# Verify it is running
curl http://127.0.0.1:5984
# Expected: {"couchdb":"Welcome",...}
```

### 4. Start MailDev (local email inbox)

```bash
# In a separate terminal
npx maildev

# SMTP listens on: localhost:1025
# Inbox UI at:     http://localhost:1080
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in every value before starting.

```dotenv
# ─────────────────────────────────────────
#  App
# ─────────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─────────────────────────────────────────
#  CouchDB
# ─────────────────────────────────────────
COUCHDB_URL=http://127.0.0.1:5984
COUCHDB_USER=admin
COUCHDB_PASSWORD=your-couchdb-password

# ─────────────────────────────────────────
#  JWT Secrets
#  Generate with: openssl rand -base64 32
# ─────────────────────────────────────────
JWT_ACCESS_SECRET=your_32_character_random_access_string_here
JWT_REFRESH_SECRET=your_64_character_random_refresh_string_here

# ─────────────────────────────────────────
#  Mail — MailDev (local development)
# ─────────────────────────────────────────
MAIL_HOST=localhost
MAIL_PORT=1025

# ─────────────────────────────────────────
#  Mail — SMTP (production only)
# ─────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

All variables are validated at startup by Zod in `src/config/env.ts`. If a required variable is missing the server will refuse to start with a clear error message.

---

## API Reference

### `POST /api/auth/register`

Create a new user account. Sends a verification email via MailDev.

**Request body**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "securepassword",
  "deviceName": "MacOS (Tee Identity)"
}
```

**Responses**

| Status | Meaning |
|---|---|
| `201` | User created. Check email to verify. |
| `400` | Missing email or password. |
| `409` | Email already registered. |
| `500` | Database connection error. |

---

### `GET /api/auth/verify-email?token=<token>`

Activates a user account. Called automatically when the user clicks the link in their verification email.

**Query params**

| Param | Required | Description |
|---|---|---|
| `token` | Yes | 64-character hex token from the email link |

**Responses**

| Status | Meaning |
|---|---|
| `200` | Email verified. User status set to `ACTIVE`. |
| `400` | Token missing, invalid, or already used. |
| `400` | Token expired. User must register again. |
| `404` | No user found for this token. |

---

### `POST /api/auth/login`

Authenticate a verified user and receive JWT tokens.

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "securepassword"
}
```

**Success response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Responses**

| Status | Meaning |
|---|---|
| `200` | Login successful. Returns access + refresh tokens. |
| `401` | Invalid credentials or email not verified. |
| `404` | User not found. |

---

### `POST /api/auth/refresh`

Exchange a valid refresh token for a new access token. Call this when `/api/auth/me` returns `401 TOKEN_EXPIRED`.

**Request body**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Success response `200`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Responses**

| Status | Meaning |
|---|---|
| `200` | New access token issued. |
| `401` | Refresh token expired — user must log in again. |
| `401` | Session not found in database. |

---

### `GET /api/auth/me`

Return the currently authenticated user. Requires a valid `Authorization` header.

**Request headers**
```
Authorization: Bearer <accessToken>
```

**Success response `200`**
```json
{
  "id": "alice@example.com",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "status": "ACTIVE",
  "emailVerified": "2026-04-27T10:00:00.000Z"
}
```

**Responses**

| Status | Meaning |
|---|---|
| `200` | Returns user object (password never included). |
| `401` | Token missing, invalid, or expired. |
| `403` | Email not verified. |
| `404` | User not found. |

---

## Auth Flow

```
┌──────────┐     POST /register      ┌───────────┐
│  Client  │ ─────────────────────▶  │  Server   │
│          │                         │           │
│          │  201 Registration OK    │ Save user │
│          │ ◀─────────────────────  │ PENDING   │
│          │                         │           │
│          │                         │ Save token│
│          │                         │ to tokenDb│
│          │                         │           │
│          │                         │ Send email│
└──────────┘                         └───────────┘
     │
     │  User clicks link in email
     ▼
┌──────────┐  GET /verify-email      ┌───────────┐
│ Browser  │ ─────────────────────▶  │  Server   │
│          │                         │           │
│          │  200 Verified           │ Set ACTIVE│
│          │ ◀─────────────────────  │ Delete tok│
└──────────┘                         └───────────┘
     │
     │  User submits login form
     ▼
┌──────────┐  POST /login            ┌───────────┐
│  Client  │ ─────────────────────▶  │  Server   │
│          │                         │           │
│          │  { accessToken,         │ Issue JWT │
│          │    refreshToken }        │ Save sess │
│          │ ◀─────────────────────  └───────────┘
│          │
│          │  GET /me (token expired)
│          │ ─────────────────────▶  401
│          │
│          │  POST /refresh
│          │ ─────────────────────▶  { accessToken }
│          │
│          │  GET /me (new token)
│          │ ─────────────────────▶  200 { user }
└──────────┘
```

---

## Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm tsc --noEmit

# Clean install — removes .next, node_modules, lockfile
pnpm cleaninstall
```

Add `cleaninstall` to your `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "cleaninstall": "rm -rf .next node_modules pnpm-lock.yaml && pnpm install"
}
```

---

## Troubleshooting

### `Unexpected token '<' — not valid JSON`

The API route is returning an HTML error page instead of JSON. This means `env.ts` is crashing at startup.

```bash
# Check terminal for a ZodError like:
# ZodError: DATABASE_URL is required

# Fix: make sure your .env has the correct keys
# Wrong keys: DATABASE_URL, NEXTAUTH_SECRET
# Correct keys: COUCHDB_URL, COUCHDB_USER, COUCHDB_PASSWORD
```

---

### `ECONNREFUSED 127.0.0.1:1025`

MailDev is not running.

```bash
npx maildev
# Then open http://localhost:1080 to see the inbox
```

---

### `Invalid or already used token`

The token from the email was generated before the `tokenDb` fix was applied. It was saved to `userDb` instead of `tokenDb`.

```bash
# Fix: delete old test users and tokens in Fauxton, then register again
http://127.0.0.1:5984/_utils
```

---

### `405 Method Not Allowed` on verify-email

Your route file only exports `POST` but the email link sends a `GET` request. Make sure `route.ts` exports both:

```typescript
export async function GET(req: Request) { ... }
export async function POST(req: Request) { ... }
```

---

### `jwt expired` on `/api/auth/me`

The access token has expired (15 minute lifetime). Use `fetchWithAuth()` from `src/lib/api-client.ts` — it automatically calls `/api/auth/refresh` and retries.

---

### CouchDB connection fails

```bash
# Verify CouchDB is running
curl http://127.0.0.1:5984
# Expected: {"couchdb":"Welcome",...}

# Check credentials match your .env
curl http://admin:admin123@127.0.0.1:5984/_all_dbs
# Expected: ["_replicator","_users","sessions","users","verificationtokens"]
```

---

## License

MIT
