-- Missing recipe metadata must remain unknown rather than receive invented values.
-- Preserve historical values: the previous defaults cannot be distinguished from
-- genuine user-supplied values. No table references meal_plans, so it can be
-- rebuilt inside the migration runner's transaction with FK enforcement on.
CREATE TABLE meal_plans_new (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_name TEXT NOT NULL,
  prep_time_minutes INTEGER,
  calories INTEGER,
  servings INTEGER,
  cooked INTEGER NOT NULL DEFAULT 0,
  missing_ingredients TEXT,
  tags TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO meal_plans_new (
  id, day, meal_type, recipe_id, recipe_name, prep_time_minutes, calories,
  servings, cooked, missing_ingredients, tags, created_at,
  kitchen_id, created_by, updated_by
)
SELECT
  id, day, meal_type, recipe_id, recipe_name, prep_time_minutes, calories,
  servings, cooked, missing_ingredients, tags, created_at,
  kitchen_id, created_by, updated_by
FROM meal_plans;

DROP TABLE meal_plans;
ALTER TABLE meal_plans_new RENAME TO meal_plans;

CREATE INDEX idx_meal_plans_day ON meal_plans(day);
CREATE INDEX idx_meal_plans_recipe_id ON meal_plans(recipe_id);
CREATE INDEX idx_meal_plans_kitchen_id ON meal_plans(kitchen_id);
