require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  // Use pg's Pool instead of Neon's template tag syntax for migrations
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running migration: 001_interview_practice_sessions.sql');

    const migrationPath = path.join(__dirname, '../lib/db/migrations/001_interview_practice_sessions.sql');
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
