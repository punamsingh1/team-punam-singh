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
