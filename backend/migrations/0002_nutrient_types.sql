-- Nutrient Types & Category Link Migration

-- Nutrient Type Table (top-level classification)
CREATE TABLE IF NOT EXISTS nutrient_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    description TEXT
);

-- Link categories to nutrient types
ALTER TABLE categories ADD COLUMN nutrient_type_id INTEGER REFERENCES nutrient_types(id) ON DELETE SET NULL;

-- Index for category -> nutrient type lookups
CREATE INDEX IF NOT EXISTS idx_categories_nutrient_type_id ON categories(nutrient_type_id);
