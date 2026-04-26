import Nano from 'nano';

const env = {
  COUCHDB_URL: process.env.COUCHDB_URL,
  USERS_DB: process.env.COUCHDB_USERS_DB,
  SESSIONS_DB: process.env.COUCHDB_SESSIONS_DB,
};

for (const [key, value] of Object.entries(env)) {
  if (!value) throw new Error(`❌ Missing env: ${key}`);
}

const couchDbUrl = env.COUCHDB_URL!;
const usersDbName = env.USERS_DB!;
const sessionsDbName = env.SESSIONS_DB!;

export const nano = Nano(couchDbUrl);

export const userDb = nano.use(usersDbName);
export const sessionDb = nano.use(sessionsDbName);