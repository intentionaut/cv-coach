// Database client configuration for Neon Serverless Postgres
import { neon } from '@neondatabase/serverless';

/**
 * Neon Serverless Postgres client
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('DATABASE_URL not found. Database queries will fail.');
}

// Create Neon SQL client
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

/**
 * Execute a SQL query using Neon's parameterized query syntax
 */
export const db = {
  query: async (queryText: string, params: any[] = []) => {
    if (!sql) {
      throw new Error('Database not configured. DATABASE_URL environment variable is missing.');
    }

    try {
      // Use Neon's sql.query() method for parameterized queries
      // Note: Neon returns rows directly, not wrapped in a result object
      const rows = await (sql as any).query(queryText, params);

      return {
        rows: rows || [],
        rowCount: rows?.length || 0
      };
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', queryText);
      console.error('Params:', params);
      throw error;
    }
  }
};

export default db;
