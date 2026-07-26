import { closeDB, getDB, initDB } from '../src/db/client.ts';
import { seedData } from './seed_data.ts';

function seedDB() {
  console.log('🌱 Starting database seed...');

  initDB();
  const db = getDB();

  const locationIds = new Map<string, number>();
  const categoryIds = new Map<string, number>();
  const unitIds = new Map<string, number>();
  const ingredientIds = new Map<string, string>(); // UUIDs are strings

  try {
    db.exec('BEGIN');

    try {
      // 0. Clean existing data (reverse dependency order)
      console.log('🧹 Cleaning existing data...');
      db.exec('DELETE FROM recipe_steps;');
      db.exec('DELETE FROM recipe_ingredients;');
      db.exec('DELETE FROM recipes;');
      db.exec('DELETE FROM ingredient_items;');
      db.exec('DELETE FROM ingredients;');
      db.exec('DELETE FROM difficulties;');
      db.exec('DELETE FROM units;');
      db.exec('DELETE FROM ingredient_groups;');
      db.exec('DELETE FROM nutrient_groups;');
      db.exec('DELETE FROM locations;');
      // Reset autoincrement sequences
      db.exec(
        "DELETE FROM sqlite_sequence WHERE name IN ('locations', 'nutrient_groups', 'ingredient_groups', 'units', 'difficulties');",
      );

      // Seed bare necessities (Locations, Nutrient Groups, Ingredient Groups, Units, Difficulties)
      const { locationIds, categoryIds, unitIds, difficultyIds } = seedBareNecessities(db);

      // 5. Insert Ingredients
      console.log('🥦 Seeding ingredients...');
      const insertIngredient = db.prepare(
        'INSERT INTO ingredients (id, name, ingredient_group_id, default_unit_id) VALUES (?, ?, ?, ?)',
      );
      for (const ing of seedData.ingredients) {
        const catId = categoryIds.get(ing.category);
        const unitId = unitIds.get(ing.default_unit);

        if (!catId) throw new Error(`Ingredient group not found: ${ing.category}`);
        if (!unitId) throw new Error(`Unit not found: ${ing.default_unit}`);

        const id = crypto.randomUUID();
        insertIngredient.run(id, ing.name, catId, unitId);
        ingredientIds.set(ing.name, id);
      }

      // 6. Insert Ingredient Items (Pantry Inventory)
      console.log('📦 Seeding pantry ingredient items...');
      const insertItem = db.prepare(
        `INSERT INTO ingredient_items
         (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date, opened_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const item of seedData.items) {
        const ingId = ingredientIds.get(item.ingredient);
        const unitId = unitIds.get(item.unit);
        const locId = locationIds.get(item.location);

        if (!ingId) throw new Error(`Ingredient not found: ${item.ingredient}`);
        if (!unitId) throw new Error(`Unit not found: ${item.unit}`);
        if (!locId) throw new Error(`Location not found: ${item.location}`);

        const id = crypto.randomUUID();
        insertItem.run(
          id,
          ingId,
          item.label,
          item.quantity,
          unitId,
          locId,
          item.expiration_date.toISOString(),
          item.purchase_date.toISOString(),
          item.opened_date ? item.opened_date.toISOString() : null,
          item.notes || null,
        );
      }

      // 7. Insert Recipes
      console.log('🍳 Seeding recipes...');
      const insertRecipe = db.prepare(
        `INSERT INTO recipes
         (id, name, description, difficulty_id, servings, prep_time, cook_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      const insertRecipeIngredient = db.prepare(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id)
         VALUES (?, ?, ?, ?)`,
      );
      const insertRecipeStep = db.prepare(
        `INSERT INTO recipe_steps (id, recipe_id, step_number, instruction_text, timer_seconds)
         VALUES (?, ?, ?, ?, ?)`,
      );

      for (const recipe of seedData.recipes) {
        const difficultyId = difficultyIds.get(recipe.difficulty);
        if (!difficultyId) throw new Error(`Difficulty not found: ${recipe.difficulty}`);

        const recipeId = crypto.randomUUID();
        insertRecipe.run(
          recipeId,
          recipe.name,
          recipe.description,
          difficultyId,
          recipe.servings,
          recipe.prep_time,
          recipe.cook_time,
        );

        // Insert Recipe Ingredients
        for (const ri of recipe.ingredients) {
          const ingId = ingredientIds.get(ri.ingredient);
          const unitId = unitIds.get(ri.unit);

          if (!ingId) throw new Error(`Ingredient not found for recipe: ${ri.ingredient}`);
          if (!unitId) throw new Error(`Unit not found for recipe: ${ri.unit}`);

          insertRecipeIngredient.run(recipeId, ingId, ri.quantity, unitId);
        }

        // Insert Recipe Steps
        for (const step of recipe.steps) {
          const stepId = crypto.randomUUID();
          insertRecipeStep.run(
            stepId,
            recipeId,
            step.step_number,
            step.instruction_text,
            step.timer_seconds || null,
          );
        }
      }

      // 8. Insert Meal Plans
      console.log('📅 Seeding meal plans...');
      db.exec('DELETE FROM meal_plans;');
      const insertMealPlan = db.prepare(
        `INSERT INTO meal_plans (id, day, meal_type, recipe_name, prep_time_minutes, calories, servings, cooked, missing_ingredients, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      if (seedData.meal_plans) {
        for (const mp of seedData.meal_plans) {
          const mpId = crypto.randomUUID();
          insertMealPlan.run(
            mpId,
            mp.day,
            mp.meal_type,
            mp.recipe_name,
            mp.prep_time_minutes,
            mp.calories,
            mp.servings,
            mp.cooked,
            JSON.stringify(mp.missing_ingredients || []),
            JSON.stringify(mp.tags || []),
          );
        }
      }

      // 9. Insert Shopping List Items
      console.log('🛒 Seeding shopping list items...');
      db.exec('DELETE FROM shopping_list_items;');
      const insertShoppingItem = db.prepare(
        `INSERT INTO shopping_list_items (id, name, category, quantity, unit, checked, estimated_price, store_name, source, recipe_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      if (seedData.shopping_list_items) {
        for (const item of seedData.shopping_list_items) {
          const sId = crypto.randomUUID();
          insertShoppingItem.run(
            sId,
            item.name,
            item.category,
            item.quantity,
            item.unit,
            item.checked,
            item.estimated_price,
            item.store_name,
            item.source,
            item.recipe_name || null,
          );
        }
      }

      db.exec('COMMIT');
      console.log('✅ Database seeded successfully!');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    Deno.exit(1);
  } finally {
    closeDB();
  }
}

if (import.meta.main) {
  seedDB();
}

/**
 * Seeds the essential system reference data required for normal app operation
 * without inserting sample user data (ingredients, stock items, recipes, shopping items).
 */
export function seedBareNecessities(db: ReturnType<typeof getDB>) {
  // 1. Insert Locations
  console.log('📍 Seeding locations...');
  const locationIds = new Map<string, number>();
  const insertLocation = db.prepare('INSERT INTO locations (name) VALUES (?)');
  for (const loc of seedData.locations) {
    insertLocation.run(loc.name);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    locationIds.set(loc.name, row.id);
  }

  // 2. Insert Nutrient Groups
  console.log('🧬 Seeding nutrient groups...');
  const nutrientGroupIds = new Map<string, number>();
  const insertNutrientGroup = db.prepare(
    'INSERT INTO nutrient_groups (name, icon, color, description) VALUES (?, ?, ?, ?)',
  );
  for (const nt of seedData.nutrient_types) {
    insertNutrientGroup.run(nt.name, nt.icon, nt.color, (nt as any).description || null);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    nutrientGroupIds.set(nt.name, row.id);
  }

  // 3. Insert Ingredient Groups
  console.log('🏷️  Seeding ingredient groups...');
  const categoryIds = new Map<string, number>();
  const insertGroup = db.prepare(
    'INSERT INTO ingredient_groups (name, nutrient_group_id) VALUES (?, ?)',
  );
  for (const cat of seedData.categories) {
    const ngId = nutrientGroupIds.get(cat.nutrient_type);
    insertGroup.run(cat.name, ngId ?? null);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    categoryIds.set(cat.name, row.id);
  }

  // 4. Insert Units
  console.log('📏 Seeding units...');
  const unitIds = new Map<string, number>();
  const insertUnit = db.prepare(
    'INSERT INTO units (name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?)',
  );
  for (const unit of seedData.units) {
    insertUnit.run(unit.name, unit.short_name, unit.type, unit.to_base_factor);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    unitIds.set(unit.name, row.id);
  }

  // 5. Insert Difficulties
  console.log('📊 Seeding difficulties...');
  const difficultyIds = new Map<string, number>();
  const insertDifficulty = db.prepare('INSERT INTO difficulties (name) VALUES (?)');
  for (const diff of seedData.difficulties) {
    insertDifficulty.run(diff.name);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    difficultyIds.set(diff.name, row.id);
  }

  return { locationIds, nutrientGroupIds, categoryIds, unitIds, difficultyIds };
}
