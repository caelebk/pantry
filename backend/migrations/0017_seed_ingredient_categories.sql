-- 0017: Seed production ingredient categories
--
-- The docker workflow only runs db:seed on a brand-new database, so existing
-- production databases never receive ingredient categories added to
-- scripts/seed_data.ts. This migration backfills the canonical Tier-1
-- taxonomy idempotently (name is UNIQUE, so re-application is a no-op).
-- Mirrors backend/scripts/seed_data.ts -> seedData.ingredient_categories.

INSERT OR IGNORE INTO ingredient_categories (name, icon, color, description)
VALUES
    ('Protein & Eggs', '🥩', '#ef4444', 'Meat, seafood, eggs, legumes, and other protein-rich ingredients.'),
    ('Dairy', '🥛', '#38bdf8', 'Milk, cream, cheese, yogurt, cultured dairy, and butter.'),
    ('Grains & Bakery', '🌾', '#f59e0b', 'Grains, pasta, bread, baked goods, and baking ingredients.'),
    ('Oils, Nuts & Seeds', '🫒', '#22c55e', 'Cooking oils, nuts, seeds, nut butters, and other shelf-stable fats.'),
    ('Produce', '🥬', '#10b981', 'Fresh fruits, vegetables, leafy greens, herbs, and aromatics.'),
    ('Herbs, Spices & Seasonings', '🧂', '#8b5cf6', 'Spices, herbs, seasonings, and flavor enhancers for culinary prep.'),
    ('Condiments & Sauces', '🍶', '#06b6d4', 'Sauces, dressings, vinegars, dips, and table condiments.'),
    ('Beverages', '☕', '#64748b', 'Hot and cold beverages, juices, coffees, teas, and liquid refreshments.'),
    ('Snacks & Prepared Foods', '📦', '#94a3b8', 'Snacks, sweets, frozen foods, and ready-to-eat or instant meals.');
