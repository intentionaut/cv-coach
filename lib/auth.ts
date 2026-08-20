import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import db from './db/client';

const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

/**
 * Find an existing user by email, or create one with no password set
 * (password_hash = ''), for use by the admin invite flow.
 */
export async function findOrCreateUserForInvite(
  email: string,
  name: string
): Promise<AuthUser> {
  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name
    };
  }

  return createUser(email, '', name);
}

/**
 * Create a one-time, 24-hour set-password token for a user and return the
 * raw token string (to be embedded in the invite link — not stored in
 * plaintext form anywhere else).
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Validate a set-password token: must exist, be unexpired, and unused.
 * Returns the associated user id, or null if invalid.
 */
export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const result = await db.query(
    `SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1`,
    [token]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0] as any;

  if (row.used_at) {
    return null;
  }

  if (new Date(row.expires_at) < new Date()) {
    return null;
  }

  return row.user_id as string;
}

/**
 * Mark a set-password token as used and set the user's new password,
 * in a single call (token is consumed once, regardless of outcome).
 */
export async function consumePasswordResetToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const userId = await validatePasswordResetToken(token);

  if (!userId) {
    return false;
  }

  await updateUserPassword(userId, newPassword);

  await db.query(
    `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1`,
    [token]
  );

  return true;
}
