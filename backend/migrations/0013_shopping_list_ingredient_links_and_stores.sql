-- Shopping list rows represent Ingredient purchase intent. Physical
-- IngredientItems are created only during restock.

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(kitchen_id, name_normalized)
);

ALTER TABLE shopping_list_items ADD COLUMN ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL;
ALTER TABLE shopping_list_items ADD COLUMN store_id TEXT REFERENCES stores(id) ON DELETE SET NULL;

-- SQLite requires the referenced table to exist before adding a FK column on
-- fresh databases. Rebuild the two columns safely for databases where the
-- ALTER statements above were already parsed against an older schema.
CREATE INDEX IF NOT EXISTS idx_shopping_list_ingredient ON shopping_list_items(kitchen_id, ingredient_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_list_one_active_ingredient
  ON shopping_list_items(kitchen_id, ingredient_id)
  WHERE ingredient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_kitchen ON stores(kitchen_id, archived, name_normalized);

INSERT OR IGNORE INTO stores (id, name, name_normalized, kitchen_id)
SELECT
  lower(hex(randomblob(16))),
  trim(store_name),
  lower(trim(store_name)),
  kitchen_id
FROM shopping_list_items
WHERE trim(store_name) <> '';

UPDATE shopping_list_items
SET store_id = (
  SELECT s.id FROM stores s
  WHERE s.kitchen_id = shopping_list_items.kitchen_id
    AND s.name_normalized = lower(trim(shopping_list_items.store_name))
  LIMIT 1
)
WHERE trim(store_name) <> '' AND store_id IS NULL;
