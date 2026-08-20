import { compare, hash } from 'bcryptjs';
import db from './db/client';

/**
 * Authentication utilities for Friday
 * Simple email/password authentication for single user
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<AuthUser> {
  const passwordHash = await hashPassword(password);

  const result = await db.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name`,
    [email, passwordHash, name]
  );

  return result.rows[0] as AuthUser;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await db.query(
    `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
    [email]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0] as any;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const result = await db.query(
    `SELECT id, email, name FROM users WHERE id = $1`,
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0] as AuthUser;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const user = await getUserByEmail(email);

  if (!user || !(user as any).password_hash) {
    return null;
  }

  const isValid = await verifyPassword(password, (user as any).password_hash);

  if (!isValid) {
    return null;
  }

  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}

/**
 * Set or change a user's password by id.
 * Used to add password login to an account that was created via Google
 * (which stores an empty password_hash), or to change an existing password.
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);

  await db.query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [passwordHash, userId]
  );
}
