import { closeDB, getDB, initDB } from '../src/db/client.ts';
import { runMigrations } from './migrate_db.ts';
import { seedData } from './seed_data.ts';
import { hashPassword } from '../src/utils/crypto.ts';

const DEFAULT_KITCHEN_ID = 'ktc_00000000-0000-4000-8000-000000000000';

export interface SeedOptions {
  isProduction?: boolean;
}

/**
 * Seeds essential system reference data without user or mock inventory data.
 */
export function seedBareNecessities(db: ReturnType<typeof getDB>) {
  console.log('📍 Seeding locations...');
  const locationIds = new Map<string, number>();
  const insertLocation = db.prepare('INSERT INTO locations (name) VALUES (?)');
  for (const loc of seedData.locations) {
    insertLocation.run(loc.name);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    locationIds.set(loc.name, row.id);
  }

  console.log('🧬 Seeding ingredient categories...');
  const ingredientCategoryIds = new Map<string, number>();
  const insertCategory = db.prepare(
    'INSERT INTO ingredient_categories (name, icon, color, description) VALUES (?, ?, ?, ?)',
  );
  for (const nt of seedData.ingredient_categories) {
    insertCategory.run(
      nt.name,
      nt.icon,
      nt.color,
      (nt as { description?: string }).description || null,
    );
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    ingredientCategoryIds.set(nt.name, row.id);
  }

  console.log('🏷️ Seeding ingredient groups...');
  const categoryIds = new Map<string, number>();
  const insertGroup = db.prepare(
    `INSERT INTO ingredient_groups (name, ingredient_category_id, kitchen_id)
     VALUES (?, ?, ?)`,
  );
  for (const cat of seedData.categories) {
    const catName = cat.ingredient_category || cat.nutrient_type;
    const catId = ingredientCategoryIds.get(catName);
    insertGroup.run(cat.name, catId ?? null, DEFAULT_KITCHEN_ID);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    categoryIds.set(cat.name, row.id);
  }

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

  console.log('📊 Seeding difficulties...');
  const difficultyIds = new Map<string, number>();
  const insertDifficulty = db.prepare('INSERT INTO difficulties (name) VALUES (?)');
  for (const diff of seedData.difficulties) {
    insertDifficulty.run(diff.name);
    const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
    difficultyIds.set(diff.name, row.id);
  }

  // Ensure default kitchen exists
  console.log('🏠 Ensuring default kitchen workspace...');
  const insertKitchen = db.prepare(
    `INSERT OR IGNORE INTO kitchens (id, name, description, created_by)
     VALUES (?, ?, ?, NULL)`,
  );
  const defaultKitchen = seedData.kitchens?.[0] || {
    id: DEFAULT_KITCHEN_ID,
    name: 'Main Kitchen',
    description: 'Default shared workspace for existing pantry inventory',
  };
  insertKitchen.run(defaultKitchen.id, defaultKitchen.name, defaultKitchen.description);

  return {
    locationIds,
    ingredientCategoryIds,
    nutrientGroupIds: ingredientCategoryIds,
    categoryIds,
    unitIds,
    difficultyIds,
  };
}

/**
 * Executes full database seeding according to environment options.
 */
export async function seedDatabase(
  db: ReturnType<typeof getDB>,
  options?: SeedOptions,
) {
  const isProduction = options?.isProduction ?? (Deno.env.get('DENO_ENV') === 'production');
  const ingredientIds = new Map<string, string>();
  const recipeIds = new Map<string, string>();
  const storeIds = new Map<string, string>();

  db.exec('BEGIN');

  try {
    // 0. Clean existing data in reverse dependency order
    console.log('🧹 Cleaning existing data...');
    db.exec('DELETE FROM sessions;');
    db.exec('DELETE FROM auth_rate_limits;');
    db.exec('DELETE FROM shopping_list_items;');
    db.exec('DELETE FROM stores;');
    db.exec('DELETE FROM meal_plans;');
    db.exec('DELETE FROM recipe_steps;');
    db.exec('DELETE FROM recipe_ingredients;');
    db.exec('DELETE FROM recipes;');
    db.exec('DELETE FROM ingredient_items;');
    db.exec('DELETE FROM ingredients;');
    db.exec('DELETE FROM kitchen_memberships;');
    db.exec('DELETE FROM credentials;');
    db.exec('DELETE FROM profiles;');
    db.exec('DELETE FROM users;');
    db.exec('DELETE FROM kitchens;');
    db.exec('DELETE FROM difficulties;');
    db.exec('DELETE FROM units;');
    db.exec('DELETE FROM ingredient_groups;');
    db.exec('DELETE FROM ingredient_categories;');
    db.exec('DELETE FROM locations;');

    // Reset autoincrement sequences
    db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('locations', 'ingredient_categories', 'ingredient_groups', 'units', 'difficulties');",
    );

    // 1. Seed bare necessities (Taxonomy & Default Kitchen)
    const { locationIds, categoryIds, unitIds, difficultyIds } = seedBareNecessities(db);

    if (isProduction) {
      console.log('🌍 Production environment detected. Skipping sample inventory and recipes.');
    } else {
      console.log(
        '🛠️ Development environment detected. Seeding sample users, inventory, and recipes...',
      );

      // 2. Seed Demo User, Profile, Credentials, and Kitchen Membership
      console.log('👤 Seeding demo users...');
      let demoUserId: string | null = null;
      if (seedData.users && seedData.users.length > 0) {
        const insertUser = db.prepare(
          `INSERT INTO users (id, email, email_normalized, status, global_role, primary_kitchen_id)
           VALUES (?, ?, ?, 'active', ?, ?)`,
        );
        const insertProfile = db.prepare(
          `INSERT INTO profiles (user_id, full_name, theme_preference, locale)
           VALUES (?, ?, ?, ?)`,
        );
        const insertCred = db.prepare(
          `INSERT INTO credentials (id, user_id, type, identifier, secret_hash)
           VALUES (?, ?, 'password', ?, ?)`,
        );
        const insertMembership = db.prepare(
          `INSERT INTO kitchen_memberships (id, kitchen_id, user_id, role, status)
           VALUES (?, ?, ?, 'owner', 'active')`,
        );

        for (const u of seedData.users) {
          const uId = u.id || crypto.randomUUID();
          if (!demoUserId) demoUserId = uId;
          const normalizedEmail = u.email.trim().toLowerCase();
          const hashed = await hashPassword(u.password || 'password123');

          insertUser.run(
            uId,
            u.email,
            normalizedEmail,
            u.globalRole || 'admin',
            DEFAULT_KITCHEN_ID,
          );
          insertProfile.run(uId, u.fullName, u.themePreference || 'system', u.locale || 'en');
          insertCred.run(crypto.randomUUID(), uId, normalizedEmail, hashed);
          insertMembership.run(crypto.randomUUID(), DEFAULT_KITCHEN_ID, uId);
        }
      }

      // 3. Seed Ingredients (Tier 3)
      console.log('🥦 Seeding ingredients...');
      const insertIngredient = db.prepare(
        `INSERT INTO ingredients (id, name, ingredient_group_id, default_unit_id, kitchen_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const ing of seedData.ingredients) {
        const catId = categoryIds.get(ing.category);
        const uId = unitIds.get(ing.default_unit);

        if (!catId) throw new Error(`Ingredient group not found: ${ing.category}`);
        if (!uId) throw new Error(`Unit not found: ${ing.default_unit}`);

        const id = crypto.randomUUID();
        insertIngredient.run(id, ing.name, catId, uId, DEFAULT_KITCHEN_ID, demoUserId, demoUserId);
        ingredientIds.set(ing.name, id);
      }

      // 4. Seed Pantry Ingredient Items (Tier 4)
      console.log('📦 Seeding pantry ingredient items...');
      const insertItem = db.prepare(
        `INSERT INTO ingredient_items
         (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date, opened_date, notes, kitchen_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const item of seedData.items) {
        const ingId = ingredientIds.get(item.ingredient);
        const uId = unitIds.get(item.unit);
        const locId = locationIds.get(item.location);

        if (!ingId) throw new Error(`Ingredient not found: ${item.ingredient}`);
        if (!uId) throw new Error(`Unit not found: ${item.unit}`);
        if (!locId) throw new Error(`Location not found: ${item.location}`);

        const id = crypto.randomUUID();
        insertItem.run(
          id,
          ingId,
          item.label,
          item.quantity,
          uId,
          locId,
          item.expiration_date ? item.expiration_date.toISOString() : null,
          item.purchase_date.toISOString(),
          item.opened_date ? item.opened_date.toISOString() : null,
          item.notes || null,
          DEFAULT_KITCHEN_ID,
          demoUserId,
          demoUserId,
        );
      }

      // 5. Seed Recipes
      console.log('🍳 Seeding recipes...');
      const insertRecipe = db.prepare(
        `INSERT INTO recipes
         (id, name, description, difficulty_id, servings, prep_time, cook_time, kitchen_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const insertRecipeIngredient = db.prepare(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, ingredient_order)
         VALUES (?, ?, ?, ?, ?)`,
      );
      const insertRecipeStep = db.prepare(
        `INSERT INTO recipe_steps (id, recipe_id, step_number, instruction_text, timer_seconds, textarea_height)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );

      for (const recipe of seedData.recipes) {
        const diffId = difficultyIds.get(recipe.difficulty);
        if (!diffId) throw new Error(`Difficulty not found: ${recipe.difficulty}`);

        const recipeId = crypto.randomUUID();
        insertRecipe.run(
          recipeId,
          recipe.name,
          recipe.description,
          diffId,
          recipe.servings,
          recipe.prep_time,
          recipe.cook_time,
          DEFAULT_KITCHEN_ID,
          demoUserId,
          demoUserId,
        );
        recipeIds.set(recipe.name, recipeId);

        let riOrder = 1;
        for (const ri of recipe.ingredients) {
          const ingId = ingredientIds.get(ri.ingredient);
          const uId = unitIds.get(ri.unit);

          if (!ingId) throw new Error(`Ingredient not found for recipe: ${ri.ingredient}`);
          if (!uId) throw new Error(`Unit not found for recipe: ${ri.unit}`);

          insertRecipeIngredient.run(recipeId, ingId, ri.quantity, uId, riOrder++);
        }

        for (const step of recipe.steps) {
          const stepId = crypto.randomUUID();
          insertRecipeStep.run(
            stepId,
            recipeId,
            step.step_number,
            step.instruction_text,
            step.timer_seconds || null,
            (step as { textarea_height?: number | null }).textarea_height || null,
          );
        }
      }

      // 6. Seed Meal Plans (linked to recipe_id)
      console.log('📅 Seeding meal plans...');
      const insertMealPlan = db.prepare(
        `INSERT INTO meal_plans (id, day, meal_type, recipe_id, recipe_name, prep_time_minutes, calories, servings, cooked, missing_ingredients, tags, kitchen_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      if (seedData.meal_plans) {
        for (const mp of seedData.meal_plans) {
          const mpId = crypto.randomUUID();
          const recipeId = recipeIds.get(mp.recipe_name) || null;
          insertMealPlan.run(
            mpId,
            mp.day,
            mp.meal_type,
            recipeId,
            mp.recipe_name,
            mp.prep_time_minutes,
            mp.calories,
            mp.servings,
            mp.cooked,
            JSON.stringify(mp.missing_ingredients || []),
            JSON.stringify(mp.tags || []),
            DEFAULT_KITCHEN_ID,
            demoUserId,
            demoUserId,
          );
        }
      }

      // 7. Seed Stores
      console.log('🏬 Seeding stores...');
      const insertStore = db.prepare(
        `INSERT INTO stores (id, name, name_normalized, kitchen_id)
         VALUES (?, ?, ?, ?)`,
      );
      const storeNames = new Set<string>();
      if (seedData.stores) {
        for (const store of seedData.stores) {
          if (store.name.trim()) storeNames.add(store.name.trim());
        }
      }
      if (seedData.shopping_list_items) {
        for (const item of seedData.shopping_list_items) {
          if (item.store_name?.trim()) storeNames.add(item.store_name.trim());
        }
      }

      for (const name of storeNames) {
        const id = crypto.randomUUID();
        insertStore.run(id, name, name.toLocaleLowerCase(), DEFAULT_KITCHEN_ID);
        storeIds.set(name, id);
      }

      // 8. Seed Shopping List Items
      console.log('🛒 Seeding shopping list items...');
      const insertShoppingItem = db.prepare(
        `INSERT INTO shopping_list_items (id, ingredient_id, name, category, quantity, unit, checked, estimated_price, store_name, store_id, source, recipe_name, kitchen_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      if (seedData.shopping_list_items) {
        for (const item of seedData.shopping_list_items) {
          const sId = crypto.randomUUID();
          const targetIngName = (item as { ingredient?: string }).ingredient || item.name;
          const ingredientId = ingredientIds.get(targetIngName) || ingredientIds.get(item.name) ||
            null;
          const storeId = storeIds.get(item.store_name) || null;

          insertShoppingItem.run(
            sId,
            ingredientId,
            item.name,
            item.category,
            item.quantity,
            item.unit,
            item.checked,
            item.estimated_price,
            item.store_name,
            storeId,
            item.source,
            item.recipe_name || null,
            DEFAULT_KITCHEN_ID,
            demoUserId,
            demoUserId,
          );
        }
      }
    }

    db.exec('COMMIT');
    console.log('✅ Database seeded successfully!');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

async function seedDB() {
  console.log('🌱 Starting database seed...');

  runMigrations();
  initDB();
  const db = getDB();

  try {
    await seedDatabase(db);
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    Deno.exit(1);
  } finally {
    closeDB();
  }
}

if (import.meta.main) {
  await seedDB();
}
