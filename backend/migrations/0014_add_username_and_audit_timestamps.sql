-- Migration 0014: Add username support and audit timestamps
PRAGMA foreign_keys = ON;

-- 1. Add username columns to users table
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN username_normalized TEXT;

-- 2. Backfill existing users with username derived from email local-part
UPDATE users SET 
  username = COALESCE(username, substr(email, 1, instr(email, '@') - 1)),
  username_normalized = COALESCE(username_normalized, lower(substr(email, 1, instr(email, '@') - 1)))
WHERE username IS NULL;

-- 3. Create Unique Index for username_normalized
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_normalized ON users(username_normalized);

-- 4. Add missing audit timestamp columns (SQLite ALTER TABLE requires constant defaults or NULL, then backfill)
ALTER TABLE ingredient_groups ADD COLUMN created_at TEXT;
ALTER TABLE ingredient_groups ADD COLUMN updated_at TEXT;

UPDATE ingredient_groups SET 
  created_at = COALESCE(created_at, datetime('now')),
  updated_at = COALESCE(updated_at, datetime('now'))
WHERE created_at IS NULL OR updated_at IS NULL;

ALTER TABLE shopping_list_items ADD COLUMN updated_at TEXT;

UPDATE shopping_list_items SET 
  updated_at = COALESCE(updated_at, created_at, datetime('now'))
WHERE updated_at IS NULL;

-- 5. Add triggers for automatic updated_at timestamping
CREATE TRIGGER IF NOT EXISTS update_ingredient_groups_updated_at
    AFTER UPDATE ON ingredient_groups
    FOR EACH ROW
BEGIN
    UPDATE ingredient_groups SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_shopping_list_items_updated_at
    AFTER UPDATE ON shopping_list_items
    FOR EACH ROW
BEGIN
    UPDATE shopping_list_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;
