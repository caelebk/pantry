import { getDB } from '../db/client.ts';
import { KitchenDTO, KitchenMemberDTO } from '../models/data-models/kitchen.model.ts';

export function createKitchen(
  name: string,
  description?: string,
  createdByUserId?: string,
  inExistingTransaction = false,
): KitchenDTO {
  const db = getDB();

  if (!inExistingTransaction) {
    db.exec('BEGIN TRANSACTION;');
  }
  try {
    const insertKitchenQuery = `
      INSERT INTO kitchens (name, description, created_by)
      VALUES (?, ?, ?)
      RETURNING id, name, description, created_by, created_at, updated_at;
    `;

    const kitchenStmt = db.prepare(insertKitchenQuery);
    const kitchenRows = kitchenStmt.values(name, description ?? null, createdByUserId ?? null);
    kitchenStmt.finalize();

    const [id, kName, kDesc, kCreatedBy, crAt, upAt] = kitchenRows[0] as [
      string,
      string,
      string | null,
      string | null,
      string,
      string,
    ];

    if (createdByUserId) {
      const insertMembershipQuery = `
        INSERT INTO kitchen_memberships (kitchen_id, user_id, role, status)
        VALUES (?, ?, 'owner', 'active');
      `;
      const memberStmt = db.prepare(insertMembershipQuery);
      memberStmt.run(id, createdByUserId);
      memberStmt.finalize();
    }

    if (!inExistingTransaction) {
      db.exec('COMMIT;');
    }

    return {
      id,
      name: kName,
      description: kDesc ?? undefined,
      createdBy: kCreatedBy ?? undefined,
      role: 'owner',
      memberCount: 1,
      createdAt: crAt,
      updatedAt: upAt,
    };
  } catch (error) {
    if (!inExistingTransaction) {
      db.exec('ROLLBACK;');
    }
    throw error;
  }
}

export function getUserKitchens(userId: string): KitchenDTO[] {
  const db = getDB();
  const query = `
    SELECT k.id, k.name, k.description, k.created_by, km.role, k.created_at, k.updated_at,
           (SELECT COUNT(*) FROM kitchen_memberships WHERE kitchen_id = k.id AND status = 'active') as member_count
    FROM kitchens k
    JOIN kitchen_memberships km ON k.id = km.kitchen_id
    WHERE km.user_id = ? AND km.status = 'active'
    ORDER BY k.created_at ASC;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(userId);
  stmt.finalize();

  return rows.map((r: unknown[]) => ({
    id: String(r[0]),
    name: String(r[1]),
    description: (r[2] as string | null) ?? undefined,
    createdBy: (r[3] as string | null) ?? undefined,
    role: r[4] as 'owner' | 'editor' | 'viewer',
    createdAt: String(r[5]),
    updatedAt: String(r[6]),
    memberCount: Number(r[7] ?? 1),
  }));
}

export function getUserKitchenRole(
  userId: string,
  kitchenId: string,
): ('owner' | 'editor' | 'viewer') | null {
  const db = getDB();
  const query = `
    SELECT role FROM kitchen_memberships
    WHERE user_id = ? AND kitchen_id = ? AND status = 'active';
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(userId, kitchenId);
  stmt.finalize();

  if (rows.length === 0) {
    return null;
  }

  return rows[0][0] as 'owner' | 'editor' | 'viewer';
}

export function getKitchenMembers(kitchenId: string): KitchenMemberDTO[] {
  const db = getDB();
  const query = `
    SELECT km.id, km.user_id, u.email, p.full_name, p.avatar_url, km.role, km.status, km.joined_at
    FROM kitchen_memberships km
    JOIN users u ON km.user_id = u.id
    JOIN profiles p ON u.id = p.user_id
    WHERE km.kitchen_id = ?
    ORDER BY km.joined_at ASC;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(kitchenId);
  stmt.finalize();

  return rows.map((r: unknown[]) => ({
    id: String(r[0]),
    userId: String(r[1]),
    email: String(r[2]),
    fullName: String(r[3]),
    avatarUrl: (r[4] as string | null) ?? undefined,
    role: r[5] as 'owner' | 'editor' | 'viewer',
    status: r[6] as 'active' | 'invited',
    joinedAt: String(r[7]),
  }));
}

export function addKitchenMember(
  kitchenId: string,
  targetEmail: string,
  role: 'owner' | 'editor' | 'viewer' = 'editor',
): KitchenMemberDTO {
  const db = getDB();
  const normalizedEmail = targetEmail.trim().toLowerCase();

  // Find user by email
  const userQuery = `SELECT id FROM users WHERE email_normalized = ?;`;
  const userStmt = db.prepare(userQuery);
  const userRows = userStmt.values(normalizedEmail);
  userStmt.finalize();

  if (userRows.length === 0) {
    throw new Error('User with specified email address does not exist.');
  }

  const userId = userRows[0][0] as string;

  const insertQuery = `
    INSERT INTO kitchen_memberships (kitchen_id, user_id, role, status)
    VALUES (?, ?, ?, 'active')
    RETURNING id, joined_at;
  `;

  try {
    const stmt = db.prepare(insertQuery);
    const rows = stmt.values(kitchenId, userId, role);
    stmt.finalize();

    const profileQuery = `SELECT full_name, avatar_url FROM profiles WHERE user_id = ?;`;
    const pStmt = db.prepare(profileQuery);
    const pRows = pStmt.values(userId);
    pStmt.finalize();

    return {
      id: rows[0][0] as string,
      userId,
      email: normalizedEmail,
      fullName: (pRows[0]?.[0] as string | undefined) ?? 'Kitchen Member',
      avatarUrl: (pRows[0]?.[1] as string | undefined) ?? undefined,
      role,
      status: 'active',
      joinedAt: rows[0][1] as string,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw new Error('User is already a member of this kitchen.');
    }
    throw err;
  }
}

export function removeKitchenMember(kitchenId: string, targetUserId: string): void {
  const db = getDB();
  const query = `DELETE FROM kitchen_memberships WHERE kitchen_id = ? AND user_id = ?;`;
  const stmt = db.prepare(query);
  stmt.run(kitchenId, targetUserId);
  stmt.finalize();
}

export function updateKitchen(kitchenId: string, name?: string, description?: string): KitchenDTO {
  const db = getDB();
  const query = `
    UPDATE kitchens
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        updated_at = datetime('now')
    WHERE id = ?
    RETURNING id, name, description, created_by, created_at, updated_at;
  `;

  const stmt = db.prepare(query);
  const rows = stmt.values(name ?? null, description ?? null, kitchenId);
  stmt.finalize();

  const [id, kName, kDesc, kCreatedBy, crAt, upAt] = rows[0] as [
    string,
    string,
    string | null,
    string | null,
    string,
    string,
  ];

  return {
    id,
    name: kName,
    description: kDesc ?? undefined,
    createdBy: kCreatedBy ?? undefined,
    role: 'owner',
    createdAt: crAt,
    updatedAt: upAt,
  };
}

export function deleteKitchen(kitchenId: string): void {
  const db = getDB();
  const query = `DELETE FROM kitchens WHERE id = ?;`;
  const stmt = db.prepare(query);
  stmt.run(kitchenId);
  stmt.finalize();
}
