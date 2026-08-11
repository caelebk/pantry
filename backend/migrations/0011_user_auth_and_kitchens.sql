-- Migration 0011: User Authentication, Profiles, Shared Kitchens, and Tenant Ownership
-- Standards: Foreign Keys Enabled, WAL Mode Compatible, Zero Duplicate Indexes, Instant Backfill

PRAGMA foreign_keys = ON;

-- 1. Users Table (Created first so FK references succeed)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    email TEXT NOT NULL UNIQUE,
    email_normalized TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
    global_role TEXT NOT NULL DEFAULT 'user' CHECK (global_role IN ('user', 'admin')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
    locale TEXT NOT NULL DEFAULT 'en',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN OLD.updated_at IS NEW.updated_at
BEGIN
    UPDATE profiles SET updated_at = datetime('now') WHERE user_id = OLD.user_id;
END;

-- 3. Credentials Table (Decoupled Auth Strategies with Strict Uniqueness)
CREATE TABLE IF NOT EXISTS credentials (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('password', 'google_oauth', 'passkey')),
    identifier TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, type),
    UNIQUE(type, identifier)
);

-- 4. Sessions Table (Server-side Session State & Refresh Token Storage)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. Kitchens Table (Multi-tenant Shared Workspaces)
CREATE TABLE IF NOT EXISTS kitchens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. Kitchen Memberships Table (RBAC Mapping)
CREATE TABLE IF NOT EXISTS kitchen_memberships (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited')),
    joined_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(kitchen_id, user_id)
);

-- 7. Audit & Security Rate Limiting Table (With Explicit Expiry Column for Fast Pruning)
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 1,
    first_attempt_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    locked_until TEXT
);

-- 8. System Default Legacy Kitchen (Created after kitchens table definition)
INSERT OR IGNORE INTO kitchens (id, name, description, created_by)
VALUES ('ktc_00000000-0000-4000-8000-000000000000', 'Main Kitchen', 'Default shared workspace for existing pantry inventory', NULL);

-- 9. Multi-Tenant Kitchen Scoping Alterations (SQLite compatible ALTER TABLE)
ALTER TABLE ingredient_items ADD COLUMN kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000';
ALTER TABLE recipes ADD COLUMN kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000';
ALTER TABLE shopping_list_items ADD COLUMN kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000';
ALTER TABLE meal_plans ADD COLUMN kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000';

-- 10. Data Backfill for Pre-Auth Inventory Records
UPDATE ingredient_items SET kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000' WHERE kitchen_id IS NULL;
UPDATE recipes SET kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000' WHERE kitchen_id IS NULL;
UPDATE shopping_list_items SET kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000' WHERE kitchen_id IS NULL;
UPDATE meal_plans SET kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000' WHERE kitchen_id IS NULL;

-- 11. High-Frequency Performance Indexes (Non-Redundant & Highly Selective)
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_kitchen_memberships_user_id ON kitchen_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_expires_at ON auth_rate_limits(expires_at);

-- High-Frequency Multi-Tenant Filtering Indexes
CREATE INDEX IF NOT EXISTS idx_ingredient_items_kitchen_avail ON ingredient_items(kitchen_id, ingredient_id, expiration_date);
CREATE INDEX IF NOT EXISTS idx_recipes_kitchen_id ON recipes(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_kitchen_id ON shopping_list_items(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_kitchen_id ON meal_plans(kitchen_id);
