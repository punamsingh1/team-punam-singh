// scripts/init-db.ts

import Nano from 'nano';

const COUCHDB_URL = process.env.COUCHDB_URL ?? 'http://admin:admin123@127.0.0.1:5984';

const nano = Nano(COUCHDB_URL);

// ─── Databases to create 
const DATABASES = ['users', 'sessions', 'verificationtokens'];

// ─── Mango indexes to create 
const INDEXES: Array<{
  db: string;
  fields: string[];
  name: string;
}> = [
  { db: 'verificationtokens', fields: ['token'],   name: 'idx-token'          },
  { db: 'verificationtokens', fields: ['email'],   name: 'idx-token-email'    },
  { db: 'users',              fields: ['email'],   name: 'idx-user-email'     },
  { db: 'sessions',           fields: ['userId'],  name: 'idx-session-userId' },
];

async function initDatabases() {
  console.log('🚀 Starting DB initialization...\n');

  // ─── Step 1: Test connection ────────────────────────────────────────────────
  try {
    await nano.db.list();
    console.log('✅ CouchDB connection successful');
  } catch {
    console.error(
      '\n❌ Cannot connect to CouchDB.',
      `\n   URL: ${process.env.COUCHDB_URL ?? 'http://127.0.0.1:5984'}`,
      '\n   Fix: Make sure CouchDB is running.',
      '\n   Try: curl http://127.0.0.1:5984\n'
    );
    process.exit(1); // stop — no point continuing if DB is unreachable
  }

  // ─── Step 2: Create databases ───────────────────────────────────────────────
  console.log('\n📦 Creating databases...');
  for (const dbName of DATABASES) {
    try {
      await nano.db.create(dbName);
      console.log(`   ✅ Created  → ${dbName}`);
    } catch (err) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 412) {
        console.log(`   🔌 Exists   → ${dbName}`);
      } else {
        console.error(`   ❌ Failed   → ${dbName}`, err);
        process.exit(1);
      }
    }
  }

  // ─── Step 3: Create Mango indexes ──────────────────────────────────────────
  console.log('\n🔍 Creating indexes...');
  for (const { db, fields, name } of INDEXES) {
    try {
      const dbHandle = nano.use(db);
      await dbHandle.createIndex({
        index: { fields },
        name,
        type: 'json',
      });
      console.log(`   ✅ Index    → ${name} on [${fields.join(', ')}] in ${db}`);
    } catch {
      // Index already exists — safe to ignore
      console.log(`   🔌 Exists   → ${name}`);
    }
  }

  console.log('\n🎉 DB initialization complete. Starting dev server...\n');
}

// ─── Run ─────────────────────────────────────────────────────────────────────
initDatabases().catch(err => {
  console.error('💥 DB init failed:', err);
  process.exit(1);
});