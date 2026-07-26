import { assertEquals, assertNotEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { mealPlanService } from '../src/services/meal-plan.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE meal_plans (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT,
      recipe_name TEXT NOT NULL,
      prep_time_minutes INTEGER NOT NULL DEFAULT 15,
      calories INTEGER NOT NULL DEFAULT 400,
      servings INTEGER NOT NULL DEFAULT 2,
      cooked INTEGER NOT NULL DEFAULT 0,
      missing_ingredients TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

Deno.test('MealPlanService - create and retrieve meal plan', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await mealPlanService.createMealPlan({
    day: 'Monday',
    mealType: 'Dinner',
    recipeName: 'Test Spaghetti',
    prepTimeMinutes: 20,
    calories: 500,
    servings: 2,
    cooked: false,
    missingIngredients: ['Garlic', 'Olive Oil'],
    tags: ['Italian'],
  });

  assertNotEquals(created.id, undefined);
  assertEquals(created.recipeName, 'Test Spaghetti');
  assertEquals(created.day, 'Monday');
  assertEquals(created.mealType, 'Dinner');
  assertEquals(created.cooked, false);
  assertEquals(created.missingIngredients, ['Garlic', 'Olive Oil']);

  const fetched = await mealPlanService.getMealPlanById(created.id);
  assertEquals(fetched?.id, created.id);
  assertEquals(fetched?.recipeName, 'Test Spaghetti');

  // Clean up
  await mealPlanService.deleteMealPlan(created.id);
  db.close();
});

Deno.test('MealPlanService - update meal plan status', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await mealPlanService.createMealPlan({
    day: 'Tuesday',
    mealType: 'Lunch',
    recipeName: 'Salad',
    cooked: false,
  });

  const updated = await mealPlanService.updateMealPlan(created.id, { cooked: true });
  assertEquals(updated?.cooked, true);

  // Clean up
  await mealPlanService.deleteMealPlan(created.id);
  db.close();
});

Deno.test('MealPlanService - delete meal plan', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await mealPlanService.createMealPlan({
    day: 'Wednesday',
    mealType: 'Breakfast',
    recipeName: 'Pancakes',
  });

  await mealPlanService.deleteMealPlan(created.id);
  const fetched = await mealPlanService.getMealPlanById(created.id);
  assertEquals(fetched, null);
  db.close();
});
