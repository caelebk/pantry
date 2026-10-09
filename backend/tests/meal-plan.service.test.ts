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
      prep_time_minutes INTEGER,
      calories INTEGER,
      servings INTEGER,
      cooked INTEGER NOT NULL DEFAULT 0,
      missing_ingredients TEXT,
      tags TEXT,
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

Deno.test('MealPlanService - missing metadata remains unknown through create and update', async () => {
  const db = createTestDB();
  setDB(db);
  try {
    const created = await mealPlanService.createMealPlan(
      {
        day: 'Monday',
        mealType: 'Dinner',
        recipeName: 'Unspecified recipe',
      },
      'test-kitchen-id',
      'test-user-id',
    );
    assertEquals(created.prepTimeMinutes, null);
    assertEquals(created.calories, null);
    assertEquals(created.servings, null);
    const updated = await mealPlanService.updateMealPlan(created.id, 'test-kitchen-id', {
      cooked: true,
    }, 'test-user-id');
    assertEquals(updated?.prepTimeMinutes, null);
    assertEquals(updated?.calories, null);
    assertEquals(updated?.servings, null);
    assertEquals((await mealPlanService.getAllMealPlans('test-kitchen-id'))[0], updated);
    assertEquals(await mealPlanService.getMealPlanById(created.id, 'other-kitchen'), null);
  } finally {
    db.close();
  }
});

Deno.test('MealPlanService - known zero metadata and user servings are preserved', async () => {
  const db = createTestDB();
  setDB(db);
  try {
    const created = await mealPlanService.createMealPlan(
      {
        day: 'Monday',
        mealType: 'Dinner',
        recipeName: 'Known recipe',
        prepTimeMinutes: 0,
        calories: 0,
        servings: 3,
      },
      'test-kitchen-id',
      'test-user-id',
    );
    assertEquals(created.prepTimeMinutes, 0);
    assertEquals(created.calories, 0);
    assertEquals(created.servings, 3);
    const updated = await mealPlanService.updateMealPlan(created.id, 'test-kitchen-id', {
      cooked: true,
    }, 'test-user-id');
    assertEquals(updated?.prepTimeMinutes, 0);
    assertEquals(updated?.calories, 0);
    assertEquals(updated?.servings, 3);
    const cleared = await mealPlanService.updateMealPlan(created.id, 'test-kitchen-id', {
      prepTimeMinutes: null,
      calories: null,
      servings: null,
    }, 'test-user-id');
    assertEquals(cleared?.prepTimeMinutes, null);
    assertEquals(cleared?.calories, null);
    assertEquals(cleared?.servings, null);
  } finally {
    db.close();
  }
});

Deno.test('MealPlanService - create and retrieve meal plan', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await mealPlanService.createMealPlan(
    {
      day: 'Monday',
      mealType: 'Dinner',
      recipeName: 'Test Spaghetti',
      prepTimeMinutes: 20,
      calories: 500,
      servings: 2,
      cooked: false,
      missingIngredients: ['Garlic', 'Olive Oil'],
      tags: ['Italian'],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  assertNotEquals(created.id, undefined);
  assertEquals(created.recipeName, 'Test Spaghetti');
  assertEquals(created.day, 'Monday');
  assertEquals(created.mealType, 'Dinner');
  assertEquals(created.cooked, false);
  assertEquals(created.missingIngredients, ['Garlic', 'Olive Oil']);

  const fetched = await mealPlanService.getMealPlanById(created.id, 'test-kitchen-id');
  assertEquals(fetched?.id, created.id);
  assertEquals(fetched?.recipeName, 'Test Spaghetti');

  // Clean up
  await mealPlanService.deleteMealPlan(created.id, 'test-kitchen-id');
  db.close();
});

Deno.test('MealPlanService - update meal plan status', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await mealPlanService.createMealPlan(
    {
      day: 'Tuesday',
      mealType: 'Lunch',
      recipeName: 'Salad',
      cooked: false,
    },
    'test-kitchen-id',
    'test-user-id',
  );

  const updated = await mealPlanService.updateMealPlan(created.id, 'test-kitchen-id', {
    cooked: true,
  }, 'test-user-id');
  assertEquals(updated?.cooked, true);

  // Clean up
  await mealPlanService.deleteMealPlan(created.id, 'test-kitchen-id');
  db.close();
});

Deno.test('MealPlanService - delete meal plan', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await mealPlanService.createMealPlan(
    {
      day: 'Wednesday',
      mealType: 'Breakfast',
      recipeName: 'Pancakes',
    },
    'test-kitchen-id',
    'test-user-id',
  );

  await mealPlanService.deleteMealPlan(created.id, 'test-kitchen-id');
  const fetched = await mealPlanService.getMealPlanById(created.id, 'test-kitchen-id');
  assertEquals(fetched, null);
  db.close();
});
