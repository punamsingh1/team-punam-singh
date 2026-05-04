

Design the authentication system from scratch with a modern architecture that works for both web and mobile (native apps).
Please do NOT use CouchDB’s built-in cookie-based authentication and do NOT rely on default NextAuth session handling.
Instead, implement a token-based system with:
Short-lived JWT access tokens (e.g. 15 minutes)
Long-lived refresh tokens (stored securely and hashed in the database)
One refresh token per device/session
A sessions collection/table to track active devices
Each login should create a new session (device-aware), and we should be able to:
List all active sessions (devices)
Revoke a specific session (logout per device)
Invalidate tokens if a session is revoked
The API should:
Use Authorization: Bearer <access_token> for authenticated requests
Provide a /refresh endpoint to rotate/renew access tokens
This should be designed as an API-first auth layer so it works consistently for:
Next.js web app
Mobile apps (React Native / Flutter)
CouchDB should be used only as a data store (users + sessions), not for authentication logic. 




///////////////////////////////////////////////////////////////////////////////////////////////////////


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

### 3. Current Status 
* ✅ **CouchDB Integration:** Done.
* ✅ **Bcrypt/JWT Security:** Done.
* ✅ **Documentation:** Done.
* ⏳ **Email (MailDev):** Done










