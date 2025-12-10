
import { seedData } from "./seed_data.ts";
import { initDB, getPool, closeDB } from "../src/db/client.ts";

async function seedDB() {
  console.log("🌱 Starting database seed...");

  await initDB();
  const pool = getPool();
  const client = await pool.connect();

  const locationIds = new Map<string, number>();
  const categoryIds = new Map<string, number>();
  const unitIds = new Map<string, number>();
  const ingredientIds = new Map<string, string>(); // UUIDs are strings

  try {
    const transaction = client.createTransaction("seed");
    await transaction.begin();

    try {
      // 1. Insert Locations
      console.log("📍 Seeding locations...");
      for (const loc of seedData.locations) {
        const result = await transaction.queryObject<{ id: number }>(
          "INSERT INTO locations (name) VALUES ($1) RETURNING id",
          [loc.name]
        );
        locationIds.set(loc.name, result.rows[0].id);
      }

      // 2. Insert Categories
      console.log("🏷️  Seeding categories...");
      for (const cat of seedData.categories) {
        const result = await transaction.queryObject<{ id: number }>(
          "INSERT INTO categories (name) VALUES ($1) RETURNING id",
          [cat.name]
        );
        categoryIds.set(cat.name, result.rows[0].id);
      }

      // 3. Insert Units
      console.log("📏 Seeding units...");
      for (const unit of seedData.units) {
        const result = await transaction.queryObject<{ id: number }>(
          "INSERT INTO units (name, type, to_base_factor) VALUES ($1, $2, $3) RETURNING id",
          [unit.name, unit.type, unit.to_base_factor]
        );
        unitIds.set(unit.name, result.rows[0].id);
      }

      // 4. Insert Difficulties
      console.log("📊 Seeding difficulties...");
      const difficultyIds = new Map<string, number>();
      for (const diff of seedData.difficulties) {
        const result = await transaction.queryObject<{ id: number }>(
          "INSERT INTO difficulties (name) VALUES ($1) RETURNING id",
          [diff.name]
        );
        difficultyIds.set(diff.name, result.rows[0].id);
      }

      // 5. Insert Ingredients
      console.log("🥦 Seeding ingredients...");
      for (const ing of seedData.ingredients) {
        const catId = categoryIds.get(ing.category);
        const unitId = unitIds.get(ing.default_unit);
        
        if (!catId) throw new Error(`Category not found: ${ing.category}`);
        if (!unitId) throw new Error(`Unit not found: ${ing.default_unit}`);

        const result = await transaction.queryObject<{ id: string }>(
          "INSERT INTO ingredients (name, category_id, default_unit_id) VALUES ($1, $2, $3) RETURNING id",
          [ing.name, catId, unitId]
        );
        ingredientIds.set(ing.name, result.rows[0].id);
      }

      // 6. Insert Items (Pantry Inventory)
      console.log("📦 Seeding pantry items...");
      for (const item of seedData.items) {
        const ingId = ingredientIds.get(item.ingredient);
        const unitId = unitIds.get(item.unit);
        const locId = locationIds.get(item.location);

        if (!ingId) throw new Error(`Ingredient not found: ${item.ingredient}`);
        if (!unitId) throw new Error(`Unit not found: ${item.unit}`);
        if (!locId) throw new Error(`Location not found: ${item.location}`);

        await transaction.queryArray(
          `INSERT INTO items 
           (ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date, opened_date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            ingId,
            item.label,
            item.quantity,
            unitId,
            locId,
            item.expiration_date,
            item.purchase_date,
            item.opened_date || null,
            item.notes || null
          ]
        );
      }

      // 7. Insert Recipes
      console.log("🍳 Seeding recipes...");
      for (const recipe of seedData.recipes) {
        const difficultyId = difficultyIds.get(recipe.difficulty);
        if (!difficultyId) throw new Error(`Difficulty not found: ${recipe.difficulty}`);

        const result = await transaction.queryObject<{ id: string }>(
          `INSERT INTO recipes 
           (name, description, difficulty_id, servings, prep_time, cook_time) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING id`,
          [
            recipe.name,
            recipe.description,
            difficultyId,
            recipe.servings,
            recipe.prep_time,
            recipe.cook_time
          ]
        );
        const recipeId = result.rows[0].id;

        // Insert Recipe Ingredients
        for (const ri of recipe.ingredients) {
          const ingId = ingredientIds.get(ri.ingredient);
          const unitId = unitIds.get(ri.unit);

          if (!ingId) throw new Error(`Ingredient not found for recipe: ${ri.ingredient}`);
          if (!unitId) throw new Error(`Unit not found for recipe: ${ri.unit}`);

          await transaction.queryArray(
            `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id) 
             VALUES ($1, $2, $3, $4)`,
            [recipeId, ingId, ri.quantity, unitId]
          );
        }

        // Insert Recipe Steps
        for (const step of recipe.steps) {
            await transaction.queryArray(
                `INSERT INTO recipe_steps (recipe_id, step_number, instruction_text, timer_seconds)
                 VALUES ($1, $2, $3, $4)`,
                 [recipeId, step.step_number, step.instruction_text, step.timer_seconds || null]
            );
        }
      }

      await transaction.commit();
      console.log("✅ Database seeded successfully!");

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    Deno.exit(1);
  } finally {
    client.release();
    await closeDB();
  }
}

if (import.meta.main) {
  seedDB();
}
