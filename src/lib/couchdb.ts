import Nano from 'nano';

const username = 'admin';
const password = 'admin123'; 
const address = '127.0.0.1:5984';

const COUCHDB_URL = `http://${username}:${password}@${address}`;

export const nano = Nano(COUCHDB_URL);

// Export database handles
export const userDb = nano.use('users');
export const sessionDb = nano.use('sessions');

export const initDatabases = async () => {
  const dbs = ['users', 'sessions'];
  for (const dbName of dbs) {
    try {
      await nano.db.create(dbName);
      console.log(`✅ Database "${dbName}" created!`);
    } catch (err: unknown) {
      const couchErr = err as { statusCode?: number };
      if (couchErr.statusCode === 412) {
        console.log(`🔌 Database "${dbName}" is ready.`);
      } else {
        console.error(`❌ CouchDB Connection failed for ${dbName}. Check if CouchDB is running.`);
      }
    }
  }
};
initDatabases().catch(err => console.error("Critical DB Initialization Failure:", err));