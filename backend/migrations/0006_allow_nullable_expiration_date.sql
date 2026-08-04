-- Migration 0006: Allow nullable expiration_date on ingredient_items table

PRAGMA foreign_keys = OFF;

-- 1. Create temporary table with nullable expiration_date
CREATE TABLE ingredient_items_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    expiration_date TEXT,
    opened_date TEXT,
    purchase_date TEXT NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Copy existing records to new table
INSERT INTO ingredient_items_new (
    id, ingredient_id, label, quantity, unit_id, expiration_date, opened_date, purchase_date, location_id, notes, created_at, updated_at
)
SELECT 
    id, ingredient_id, label, quantity, unit_id, expiration_date, opened_date, purchase_date, location_id, notes, created_at, updated_at
FROM ingredient_items;

-- 3. Drop old table and triggers/indexes
DROP TRIGGER IF EXISTS update_ingredient_items_updated_at;
DROP INDEX IF EXISTS idx_ingredient_items_ingredient_id;
DROP INDEX IF EXISTS idx_ingredient_items_location_id;
DROP INDEX IF EXISTS idx_ingredient_items_unit_id;

DROP TABLE ingredient_items;

-- 4. Rename new table to ingredient_items
ALTER TABLE ingredient_items_new RENAME TO ingredient_items;

-- 5. Re-create indexes
CREATE INDEX IF NOT EXISTS idx_ingredient_items_ingredient_id ON ingredient_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_location_id ON ingredient_items(location_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_unit_id ON ingredient_items(unit_id);

-- 6. Re-create updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_ingredient_items_updated_at
    AFTER UPDATE ON ingredient_items
    FOR EACH ROW
BEGIN
    UPDATE ingredient_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;

PRAGMA foreign_keys = ON;
