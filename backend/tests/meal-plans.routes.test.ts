import { assertEquals } from '@std/assert';
import app from '../src/app.ts';
import { MealPlanDTO } from '../src/models/data-models/meal-plan.model.ts';
import { mealPlanService } from '../src/services/meal-plan.service.ts';

const mockMealPlan: MealPlanDTO = {
  id: 'mp-123',
  day: 'Monday',
  mealType: 'Dinner',
  recipeId: 'rec-1',
  recipeName: 'Tuscan Chicken',
  prepTimeMinutes: 20,
  calories: 450,
  servings: 2,
  cooked: false,
  missingIngredients: [],
  tags: ['Italian'],
  createdAt: new Date().toISOString(),
};

Deno.test('Meal Plans API - GET /api/v1/meal-plans - success', async () => {
  const originalGetAll = mealPlanService.getAllMealPlans;
  mealPlanService.getAllMealPlans = (_kitchenId) => Promise.resolve([mockMealPlan]);

  const res = await app.request('/api/v1/meal-plans');
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.length, 1);
  assertEquals(json.data[0].id, mockMealPlan.id);

  mealPlanService.getAllMealPlans = originalGetAll;
});

Deno.test('Meal Plans API - GET /api/v1/meal-plans/:id - success', async () => {
  const originalGetById = mealPlanService.getMealPlanById;
  mealPlanService.getMealPlanById = (id, _kitchenId) =>
    id === mockMealPlan.id ? Promise.resolve(mockMealPlan) : Promise.resolve(null);

  const res = await app.request(`/api/v1/meal-plans/${mockMealPlan.id}`);
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.id, mockMealPlan.id);

  mealPlanService.getMealPlanById = originalGetById;
});

Deno.test('Meal Plans API - GET /api/v1/meal-plans/:id - not found', async () => {
  const originalGetById = mealPlanService.getMealPlanById;
  mealPlanService.getMealPlanById = (_id, _kitchenId) => Promise.resolve(null);

  const res = await app.request('/api/v1/meal-plans/non-existent');
  assertEquals(res.status, 404);

  const json = await res.json();
  assertEquals(json.status, 'error');

  mealPlanService.getMealPlanById = originalGetById;
});

Deno.test('Meal Plans API - POST /api/v1/meal-plans - success', async () => {
  const originalCreate = mealPlanService.createMealPlan;
  mealPlanService.createMealPlan = (dto, _kitchenId) =>
    Promise.resolve({ ...mockMealPlan, recipeName: dto.recipeName });

  const res = await app.request('/api/v1/meal-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day: 'Tuesday', mealType: 'Lunch', recipeName: 'Salad' }),
  });
  assertEquals(res.status, 201);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.recipeName, 'Salad');

  mealPlanService.createMealPlan = originalCreate;
});

Deno.test('Meal Plans API - POST /api/v1/meal-plans - missing required fields', async () => {
  const res = await app.request('/api/v1/meal-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day: 'Tuesday' }),
  });
  assertEquals(res.status, 400);
});

Deno.test('Meal Plans API - PUT /api/v1/meal-plans/:id - success', async () => {
  const originalUpdate = mealPlanService.updateMealPlan;
  mealPlanService.updateMealPlan = (id, _kitchenId, body) =>
    Promise.resolve({ ...mockMealPlan, id, cooked: body.cooked ?? false });

  const res = await app.request(`/api/v1/meal-plans/${mockMealPlan.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cooked: true }),
  });
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.cooked, true);

  mealPlanService.updateMealPlan = originalUpdate;
});

Deno.test('Meal Plans API - DELETE /api/v1/meal-plans/:id - success', async () => {
  const originalDelete = mealPlanService.deleteMealPlan;
  mealPlanService.deleteMealPlan = (_id, _kitchenId) => Promise.resolve(true);

  const res = await app.request(`/api/v1/meal-plans/${mockMealPlan.id}`, {
    method: 'DELETE',
  });
  assertEquals(res.status, 200);

  mealPlanService.deleteMealPlan = originalDelete;
});
