import argon2 from 'argon2';
import { sign, verify } from 'hono/jwt';
import { timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

export interface JWTPayload {
  userId: string;
  email: string;
  globalRole: string;
  primaryKitchenId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Hashes a plain text password using Argon2id with OWASP-recommended parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a plain text password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Performs timing-safe constant-time string comparison to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  return timingSafeEqual(bufA, bufB);
}

/**
 * Generates a cryptographically secure 32-byte (64 hex characters) random refresh token.
 */
export function generateRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes a SHA-256 hex digest hash of a token string for secure server-side storage.
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a signed JWT Access Token with specified expiration TTL in seconds (default 15 mins / 900s).
 */
export async function generateAccessToken(
  payload: JWTPayload,
  secret: string,
  expiresInSeconds = 900,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  return await sign(fullPayload, secret);
}

/**
 * Verifies and decodes a signed JWT Access Token.
 */
export async function verifyAccessToken(token: string, secret: string): Promise<JWTPayload> {
  const decoded = await verify(token, secret, 'HS256');
  return decoded as unknown as JWTPayload;
}
