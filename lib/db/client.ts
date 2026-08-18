// Database client configuration for Neon Serverless Postgres
import { neon } from '@neondatabase/serverless';

/**
 * Neon Serverless Postgres client
 *
 * Environment variable required:
 * - DATABASE_URL (automatically set by Neon integration in Vercel)
 *
 * NOTE: This is a simplified client. For production use, consider using
 * a query builder like Drizzle ORM or Kysely with Neon.
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('DATABASE_URL not found. Database queries will fail.');
}

// Create Neon SQL client
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

/**
 * Execute a SQL query
 * @param query - SQL query string
 * @param params - Array of parameters (not yet implemented for Neon)
 * @returns Query results
 *
 * TODO: Implement parameterized queries properly for Neon
 */
export const db = {
  query: async (query: string, params: any[] = []) => {
    if (!sql) {
      throw new Error('Database not configured. DATABASE_URL environment variable is missing.');
    }

    // Temporary implementation - replace with proper parameterized queries
    const result = await sql`SELECT 1`;
    return {
      rows: [] as any[],
      rowCount: 0
    };
  }
};

export default db;
