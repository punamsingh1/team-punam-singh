import Nano from 'nano';

const env = {
  COUCHDB_URL: process.env.COUCHDB_URL,
  COUCHDB_USER: process.env.COUCHDB_USER,
  COUCHDB_PASSWORD: process.env.COUCHDB_PASSWORD,
  COUCHDB_AUTH_DB: process.env.COUCHDB_AUTH_DB,
};

for (const [key, value] of Object.entries(env)) {
  if (!value) throw new Error(`❌ Missing env: ${key}`);
}

const url = new URL(env.COUCHDB_URL!);
url.username = env.COUCHDB_USER!;
url.password = env.COUCHDB_PASSWORD!;

export const nano = Nano(url.toString());

export const authDb = nano.db.use(env.COUCHDB_AUTH_DB!);