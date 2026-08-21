// override: true - a stale DATABASE_URL already set in the shell (e.g. from
// another local project) otherwise silently wins over the one just pulled
// from Vercel, since dotenv doesn't override existing env vars by default.
require('dotenv').config({ path: '.env.local', override: true });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('❌ Usage: node scripts/run-migration.js <filename in lib/db/migrations/>');
    process.exit(1);
  }

  // Use pg's Pool instead of Neon's template tag syntax for migrations
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Running migration: ${migrationFile}`);

    const migrationPath = path.join(__dirname, '../lib/db/migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the entire migration file
    console.log('Executing migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
