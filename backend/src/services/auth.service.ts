import { getDB } from '../db/client.ts';
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  JWTPayload,
  verifyPassword,
} from '../utils/crypto.ts';
import {
  AuthResponseDTO,
  ChangePasswordRequest,
  LoginRequest,
  SignupRequest,
  UpdateProfileRequest,
  UserDTO,
} from '../models/data-models/auth.model.ts';
import { KitchenDTO } from '../models/data-models/kitchen.model.ts';
import {
  createSession,
  findSessionByToken,
  revokeAllSessionsForUser,
  revokeSessionByToken,
} from './session.service.ts';
import { createKitchen, getUserKitchens } from './kitchen.service.ts';
import { config } from '../config/env.ts';

// Pre-computed dummy Argon2id hash for constant-time missing user timing protection
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$ZHVtbXlzYWx0MTIzNDU2Nw$dummyhash1234567890abcdefghijklmnopqrstuvwxyz';

export async function signupUser(
  request: SignupRequest,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ authResponse: AuthResponseDTO; refreshToken: string }> {
  const db = getDB();
  const normalizedEmail = request.email.trim().toLowerCase();

  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Check duplicate email
    const dupQuery = `SELECT id FROM users WHERE email_normalized = ?;`;
    const dupStmt = db.prepare(dupQuery);
    const dupRows = dupStmt.values(normalizedEmail);
    dupStmt.finalize();

    if (dupRows.length > 0) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // 2. Create User record
    const insertUserQuery = `
      INSERT INTO users (email, email_normalized, status, global_role)
      VALUES (?, ?, 'active', 'user')
      RETURNING id, email, global_role, created_at, updated_at;
    `;
    const userStmt = db.prepare(insertUserQuery);
    const userRows = userStmt.values(request.email.trim(), normalizedEmail);
    userStmt.finalize();

    const [userId, email, globalRole, createdAt, updatedAt] = userRows[0] as [
      string,
      string,
      string,
      string,
      string,
    ];

    // 3. Create Credentials record
    const passwordHash = await hashPassword(request.password);
    const insertCredQuery = `
      INSERT INTO credentials (user_id, type, identifier, secret_hash)
      VALUES (?, 'password', ?, ?);
    `;
    const credStmt = db.prepare(insertCredQuery);
    credStmt.run(userId, normalizedEmail, passwordHash);
    credStmt.finalize();

    // 4. Create Profile record
    const insertProfileQuery = `
      INSERT INTO profiles (user_id, full_name, theme_preference, locale)
      VALUES (?, ?, 'system', 'en');
    `;
    const profStmt = db.prepare(insertProfileQuery);
    profStmt.run(userId, request.fullName.trim());
    profStmt.finalize();

    // 5. Create Default Personal Kitchen
    const kitchenName = `${request.fullName.trim()}'s Kitchen`;
    const kitchen = createKitchen(kitchenName, 'Personal kitchen workspace', userId, true);

    // Set as primary kitchen
    const updatePrimaryKitchenQuery = `UPDATE users SET primary_kitchen_id = ? WHERE id = ?`;
    const pkStmt = db.prepare(updatePrimaryKitchenQuery);
    pkStmt.run(kitchen.id, userId);
    pkStmt.finalize();

    db.exec('COMMIT;');

    // 6. Create Session & Tokens
    const refreshToken = generateRefreshToken();
    await createSession(userId, refreshToken, userAgent, ipAddress);

    const jwtPayload: JWTPayload = {
      userId,
      email,
      globalRole,
      primaryKitchenId: kitchen.id,
    };

    const accessToken = await generateAccessToken(
      jwtPayload,
      config.jwt.secret,
      config.jwt.expiresInSeconds,
    );

    const userDTO: UserDTO = {
      id: userId,
      email,
      fullName: request.fullName.trim(),
      globalRole,
      themePreference: 'system',
      locale: 'en',
      primaryKitchenId: kitchen.id,
      createdAt,
      updatedAt,
    };

    return {
      authResponse: {
        user: userDTO,
        accessToken,
        expiresIn: config.jwt.expiresInSeconds,
      },
      refreshToken,
    };
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

export async function loginUser(
  request: LoginRequest,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ authResponse: AuthResponseDTO; refreshToken: string }> {
  const db = getDB();
  const normalizedEmail = request.email.trim().toLowerCase();

  // Find User & Credential
  const userQuery = `
    SELECT u.id, u.email, u.global_role, c.secret_hash, p.full_name, p.theme_preference, p.locale, u.primary_kitchen_id
    FROM users u
    JOIN credentials c ON u.id = c.user_id AND c.type = 'password'
    JOIN profiles p ON u.id = p.user_id
    WHERE u.email_normalized = ? AND u.status = 'active';
  `;

  const stmt = db.prepare(userQuery);
  const rows = stmt.values(normalizedEmail);
  stmt.finalize();

  if (rows.length === 0) {
    // Constant-time execution for missing email
    await verifyPassword(DUMMY_HASH, request.password);
    throw new Error('INVALID_CREDENTIALS');
  }

  const [userId, email, globalRole, secretHash, fullName, themePref, locale, primaryKitchenId] =
    rows[0] as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];

  const isValidPassword = await verifyPassword(secretHash, request.password);
  if (!isValidPassword) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Fallback to first kitchen if primaryKitchenId is not set
  let activeKitchenId = primaryKitchenId;
  if (!activeKitchenId) {
    const kitchens = getUserKitchens(userId);
    activeKitchenId = kitchens[0]?.id;
  }

  // Create Session & Tokens
  const refreshToken = generateRefreshToken();
  await createSession(userId, refreshToken, userAgent, ipAddress);

  const jwtPayload: JWTPayload = {
    userId,
    email,
    globalRole,
    primaryKitchenId: activeKitchenId,
  };

  const accessToken = await generateAccessToken(
    jwtPayload,
    config.jwt.secret,
    config.jwt.expiresInSeconds,
  );

  const userDTO: UserDTO = {
    id: userId,
    email,
    fullName,
    globalRole,
    themePreference: themePref,
    locale,
    primaryKitchenId: activeKitchenId,
  };

  return {
    authResponse: {
      user: userDTO,
      accessToken,
      expiresIn: config.jwt.expiresInSeconds,
    },
    refreshToken,
  };
}

export async function refreshUserSession(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ accessToken: string; expiresIn: number; newRefreshToken: string }> {
  const session = await findSessionByToken(refreshToken);

  if (!session) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  // Token Reuse / Stolen Token Detection Check
  if (session.revoked_at) {
    // Revoke ALL active sessions for user to protect account!
    revokeAllSessionsForUser(session.user_id);
    throw new Error('STOLEN_TOKEN_REUSE_DETECTED');
  }

  // Expiry check
  if (new Date(session.expires_at) < new Date()) {
    throw new Error('EXPIRED_REFRESH_TOKEN');
  }

  // Single-use Rotation: Revoke current session & issue new one
  await revokeSessionByToken(refreshToken);

  const newRefreshToken = generateRefreshToken();
  await createSession(session.user_id, newRefreshToken, userAgent, ipAddress);

  // Fetch user profile details
  const db = getDB();
  const userQuery = `
    SELECT u.id, u.email, u.global_role, u.primary_kitchen_id
    FROM users u
    WHERE u.id = ? AND u.status = 'active';
  `;
  const stmt = db.prepare(userQuery);
  const userRows = stmt.values(session.user_id);
  stmt.finalize();

  if (userRows.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const [userId, email, globalRole, primaryKitchenId] = userRows[0] as [
    string,
    string,
    string,
    string,
  ];
  const kitchens = getUserKitchens(userId);
  const activeKitchenId = primaryKitchenId || kitchens[0]?.id;

  const jwtPayload: JWTPayload = {
    userId,
    email,
    globalRole,
    primaryKitchenId: activeKitchenId,
  };

  const accessToken = await generateAccessToken(
    jwtPayload,
    config.jwt.secret,
    config.jwt.expiresInSeconds,
  );

  return {
    accessToken,
    expiresIn: config.jwt.expiresInSeconds,
    newRefreshToken,
  };
}

export async function logoutUserSession(refreshToken: string): Promise<void> {
  await revokeSessionByToken(refreshToken);
}

export function getUserProfile(userId: string): { user: UserDTO; memberships: KitchenDTO[] } {
  const db = getDB();
  const query = `
    SELECT u.id, u.email, u.global_role, p.full_name, p.avatar_url, p.theme_preference, p.locale, u.created_at, u.updated_at, u.primary_kitchen_id
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ? AND u.status = 'active';
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(userId);
  stmt.finalize();

  if (rows.length === 0) {
    throw new Error('USER_NOT_FOUND');
  }

  const [
    id,
    email,
    globalRole,
    fullName,
    avatarUrl,
    themePref,
    locale,
    crAt,
    upAt,
    primaryKitchenId,
  ] = rows[0] as [
    string,
    string,
    string,
    string,
    string | null,
    string,
    string,
    string,
    string,
    string,
  ];

  const memberships = getUserKitchens(userId);

  return {
    user: {
      id,
      email,
      fullName,
      avatarUrl: avatarUrl ?? undefined,
      themePreference: themePref,
      locale,
      globalRole,
      primaryKitchenId: primaryKitchenId || memberships[0]?.id,
      createdAt: crAt,
      updatedAt: upAt,
    },
    memberships,
  };
}

export function updateUserProfile(userId: string, request: UpdateProfileRequest): UserDTO {
  const db = getDB();
  const query = `
    UPDATE profiles
    SET full_name = COALESCE(?, full_name),
        avatar_url = COALESCE(?, avatar_url),
        theme_preference = COALESCE(?, theme_preference),
        locale = COALESCE(?, locale),
        updated_at = datetime('now')
    WHERE user_id = ?;
  `;

  const stmt = db.prepare(query);
  stmt.run(
    request.fullName ?? null,
    request.avatarUrl ?? null,
    request.themePreference ?? null,
    request.locale ?? null,
    userId,
  );
  stmt.finalize();

  return getUserProfile(userId).user;
}

export async function changeUserPassword(
  userId: string,
  request: ChangePasswordRequest,
): Promise<void> {
  const db = getDB();
  const query = `SELECT secret_hash FROM credentials WHERE user_id = ? AND type = 'password';`;
  const stmt = db.prepare(query);
  const rows = stmt.values(userId);
  stmt.finalize();

  if (rows.length === 0) {
    throw new Error('CREDENTIALS_NOT_FOUND');
  }

  const currentHash = rows[0][0] as string;
  const isValid = await verifyPassword(currentHash, request.currentPassword);
  if (!isValid) {
    throw new Error('INVALID_CURRENT_PASSWORD');
  }

  const newHash = await hashPassword(request.newPassword);
  const updateQuery = `
    UPDATE credentials
    SET secret_hash = ?, last_used_at = datetime('now'), updated_at = datetime('now')
    WHERE user_id = ? AND type = 'password';
  `;

  const uStmt = db.prepare(updateQuery);
  uStmt.run(newHash, userId);
  uStmt.finalize();

  // Revoke other sessions on password change
  revokeAllSessionsForUser(userId);
}
