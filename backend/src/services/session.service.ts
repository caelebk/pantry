import { getDB } from '../db/client.ts';
import { hashToken } from '../utils/crypto.ts';
import { UserSessionDTO } from '../models/data-models/auth.model.ts';

export interface SessionRecord {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent?: string;
  ip_address?: string;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
}

export async function createSession(
  userId: string,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string,
  expiresInDays = 7,
): Promise<SessionRecord> {
  const db = getDB();
  const tokenHash = await hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const query = `
    INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(userId, tokenHash, userAgent ?? null, ipAddress ?? null, expiresAt);
  stmt.finalize();

  const [id, uId, hash, uAgent, ip, expAt, revAt, crAt, upAt] = rows[0] as [
    string,
    string,
    string,
    string | null,
    string | null,
    string,
    string | null,
    string,
    string,
  ];

  return {
    id,
    user_id: uId,
    refresh_token_hash: hash,
    user_agent: uAgent ?? undefined,
    ip_address: ip ?? undefined,
    expires_at: expAt,
    revoked_at: revAt ?? undefined,
    created_at: crAt,
    updated_at: upAt,
  };
}

export async function findSessionByToken(refreshToken: string): Promise<SessionRecord | null> {
  const db = getDB();
  const tokenHash = await hashToken(refreshToken);

  const query = `
    SELECT id, user_id, refresh_token_hash, user_agent, ip_address, expires_at, revoked_at, created_at, updated_at
    FROM sessions
    WHERE refresh_token_hash = ?;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(tokenHash);
  stmt.finalize();

  if (rows.length === 0) {
    return null;
  }

  const [id, uId, hash, uAgent, ip, expAt, revAt, crAt, upAt] = rows[0] as [
    string,
    string,
    string,
    string | null,
    string | null,
    string,
    string | null,
    string,
    string,
  ];

  return {
    id,
    user_id: uId,
    refresh_token_hash: hash,
    user_agent: uAgent ?? undefined,
    ip_address: ip ?? undefined,
    expires_at: expAt,
    revoked_at: revAt ?? undefined,
    created_at: crAt,
    updated_at: upAt,
  };
}

export async function revokeSessionByToken(refreshToken: string): Promise<void> {
  const db = getDB();
  const tokenHash = await hashToken(refreshToken);

  const query = `
    UPDATE sessions
    SET revoked_at = datetime('now')
    WHERE refresh_token_hash = ? AND revoked_at IS NULL;
  `;

  const stmt = db.prepare(query);
  stmt.run(tokenHash);
  stmt.finalize();
}

export function revokeAllSessionsForUser(userId: string): void {
  const db = getDB();
  const query = `
    UPDATE sessions
    SET revoked_at = datetime('now')
    WHERE user_id = ? AND revoked_at IS NULL;
  `;

  const stmt = db.prepare(query);
  stmt.run(userId);
  stmt.finalize();
}

export function getUserActiveSessions(
  userId: string,
  currentSessionTokenHash?: string,
): UserSessionDTO[] {
  const db = getDB();
  const query = `
    SELECT id, user_agent, ip_address, expires_at, created_at, refresh_token_hash
    FROM sessions
    WHERE user_id = ? AND revoked_at IS NULL AND expires_at > datetime('now')
    ORDER BY created_at DESC;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(userId);
  stmt.finalize();

  return rows.map((r: unknown[]) => ({
    id: String(r[0]),
    userAgent: (r[1] as string | null) ?? 'Unknown Device',
    ipAddress: (r[2] as string | null) ?? 'Unknown IP',
    expiresAt: String(r[3]),
    createdAt: String(r[4]),
    isCurrent: currentSessionTokenHash ? r[5] === currentSessionTokenHash : false,
  }));
}
