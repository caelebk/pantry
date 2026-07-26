import { Context, Hono } from 'hono';
import { CreateMealPlanDTO, UpdateMealPlanDTO } from '../models/data-models/meal-plan.model.ts';
import { mealPlanService } from '../services/meal-plan.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';

const mealPlans = new Hono();

// GET /api/meal-plans - Get all planned meals
mealPlans.get('/', async (c: Context) => {
  try {
    const data = await mealPlanService.getAllMealPlans();
    return c.json(successResponse(data), HttpStatusCode.OK);
  } catch (error: unknown) {
    console.error('Error fetching meal plans:', error);
    return c.json(errorResponse('Failed to fetch meal plans'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

// GET /api/meal-plans/:id - Get meal plan by ID
mealPlans.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    const plan = await mealPlanService.getMealPlanById(id);
    if (plan) {
      return c.json(successResponse(plan), HttpStatusCode.OK);
    }
    return c.json(errorResponse('Meal plan not found'), HttpStatusCode.NOT_FOUND);
  } catch (error: unknown) {
    console.error('Error fetching meal plan:', error);
    return c.json(errorResponse('Failed to fetch meal plan'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

// POST /api/meal-plans - Add a new planned meal
mealPlans.post('/', async (c: Context) => {
  try {
    const body: CreateMealPlanDTO = await c.req.json();
    if (!body || !body.day || !body.mealType || !body.recipeName) {
      return c.json(errorResponse('day, mealType, and recipeName are required'), HttpStatusCode.BAD_REQUEST);
    }
    const created = await mealPlanService.createMealPlan(body);
    return c.json(successResponse(created), HttpStatusCode.CREATED);
  } catch (error: unknown) {
    console.error('Error creating meal plan:', error);
    return c.json(errorResponse('Failed to create meal plan'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

// PUT /api/meal-plans/:id - Update planned meal
mealPlans.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    const body: UpdateMealPlanDTO = await c.req.json();
    const updated = await mealPlanService.updateMealPlan(id, body);
    if (updated) {
      return c.json(successResponse(updated), HttpStatusCode.OK);
    }
    return c.json(errorResponse('Meal plan not found'), HttpStatusCode.NOT_FOUND);
  } catch (error: unknown) {
    console.error('Error updating meal plan:', error);
    return c.json(errorResponse('Failed to update meal plan'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

// DELETE /api/meal-plans/:id - Delete planned meal
mealPlans.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    await mealPlanService.deleteMealPlan(id);
    return c.json(successResponse({ message: 'Meal plan deleted successfully' }), HttpStatusCode.OK);
  } catch (error: unknown) {
    console.error('Error deleting meal plan:', error);
    return c.json(errorResponse('Failed to delete meal plan'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

export default mealPlans;
