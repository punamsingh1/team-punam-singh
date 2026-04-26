import { nano } from '../src/lib/couchdb';

const config = {
  USERS_DB: process.env.COUCHDB_USERS_DB,
  SESSIONS_DB: process.env.COUCHDB_SESSIONS_DB,
};

// Validation
for (const [key, value] of Object.entries(config)) {
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
}

async function initDatabases() {
  const dbs = [
    config.USERS_DB,
    config.SESSIONS_DB,
  ] as string[];

  console.log('🚀 Starting CouchDB initialization...');

  for (const dbName of dbs) {
    try {
      await nano.db.create(dbName);
      console.log(`✅ Database "${dbName}" created successfully`);
    } catch (err: unknown) {
      const couchErr = err as { statusCode?: number; message?: string };

      if (couchErr.statusCode === 412) {
        console.log(`🔌 Database "${dbName}" already exists (skipped)`);
      } else {
        console.error(
          `❌ Failed to create database "${dbName}":`,
          couchErr.message || err
        );
        throw err;
      }
    }
  }

  console.log('🎉 CouchDB initialization completed');
}

initDatabases()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Critical initialization failure:', err);
    process.exit(1);
  });