import { getDB } from '../db/client.ts';
import {
  CreateMealPlanDTO,
  MealPlanDTO,
  UpdateMealPlanDTO,
} from '../models/data-models/meal-plan.model.ts';

export interface MealPlanRow {
  id: string;
  day: string;
  meal_type: string;
  recipe_id: string | null;
  recipe_name: string;
  prep_time_minutes: number;
  calories: number;
  servings: number;
  cooked: number;
  missing_ingredients: string | null;
  tags: string | null;
  created_at: string;
}

export class MealPlanService {
  getAllMealPlans(kitchenId: string): Promise<MealPlanDTO[]> {
    const db = getDB();
    const rows = db.prepare(
      'SELECT * FROM meal_plans WHERE kitchen_id = ? ORDER BY created_at ASC',
    ).all(kitchenId) as MealPlanRow[];
    return Promise.resolve(rows.map(this.mapRowToDTO));
  }

  getMealPlanById(id: string, kitchenId: string): Promise<MealPlanDTO | null> {
    const db = getDB();
    const row = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND kitchen_id = ?').get(
      id,
      kitchenId,
    ) as
      | MealPlanRow
      | undefined;
    return Promise.resolve(row ? this.mapRowToDTO(row) : null);
  }

  createMealPlan(data: CreateMealPlanDTO, kitchenId: string, userId: string): Promise<MealPlanDTO> {
    const db = getDB();
    const id = crypto.randomUUID();
    const missingJson = JSON.stringify(data.missingIngredients || []);
    const tagsJson = JSON.stringify(data.tags || []);

    db.prepare(`
      INSERT INTO meal_plans (id, day, meal_type, recipe_id, recipe_name, prep_time_minutes, calories, servings, cooked, missing_ingredients, tags, kitchen_id, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.day,
      data.mealType,
      data.recipeId || null,
      data.recipeName,
      data.prepTimeMinutes || 15,
      data.calories || 400,
      data.servings || 2,
      data.cooked ? 1 : 0,
      missingJson,
      tagsJson,
      kitchenId,
      userId,
      userId,
    );

    const row = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND kitchen_id = ?').get(
      id,
      kitchenId,
    ) as MealPlanRow;
    return Promise.resolve(this.mapRowToDTO(row));
  }

  async updateMealPlan(
    id: string,
    kitchenId: string,
    data: UpdateMealPlanDTO,
    userId: string,
  ): Promise<MealPlanDTO | null> {
    const db = getDB();
    const existing = await this.getMealPlanById(id, kitchenId);
    if (!existing) return null;

    const day = data.day !== undefined ? data.day : existing.day;
    const mealType = data.mealType !== undefined ? data.mealType : existing.mealType;
    const recipeId = data.recipeId !== undefined ? data.recipeId : existing.recipeId;
    const recipeName = data.recipeName !== undefined ? data.recipeName : existing.recipeName;
    const prepTime = data.prepTimeMinutes !== undefined
      ? data.prepTimeMinutes
      : existing.prepTimeMinutes;
    const calories = data.calories !== undefined ? data.calories : existing.calories;
    const servings = data.servings !== undefined ? data.servings : existing.servings;
    const cooked = data.cooked !== undefined ? (data.cooked ? 1 : 0) : (existing.cooked ? 1 : 0);
    const missingJson = data.missingIngredients !== undefined
      ? JSON.stringify(data.missingIngredients)
      : JSON.stringify(existing.missingIngredients);
    const tagsJson = data.tags !== undefined
      ? JSON.stringify(data.tags)
      : JSON.stringify(existing.tags);

    db.prepare(`
      UPDATE meal_plans
      SET day = ?, meal_type = ?, recipe_id = ?, recipe_name = ?, prep_time_minutes = ?, calories = ?, servings = ?, cooked = ?, missing_ingredients = ?, tags = ?, updated_by = ?
      WHERE id = ? AND kitchen_id = ?
    `).run(
      day,
      mealType,
      recipeId || null,
      recipeName,
      prepTime,
      calories,
      servings,
      cooked,
      missingJson,
      tagsJson,
      userId,
      id,
      kitchenId,
    );

    const row = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND kitchen_id = ?').get(
      id,
      kitchenId,
    ) as MealPlanRow;
    return this.mapRowToDTO(row);
  }

  deleteMealPlan(id: string, kitchenId: string): Promise<boolean> {
    const db = getDB();
    db.prepare('DELETE FROM meal_plans WHERE id = ? AND kitchen_id = ?').run(id, kitchenId);
    return Promise.resolve(true);
  }

  private mapRowToDTO(row: MealPlanRow): MealPlanDTO {
    let missing: string[] = [];
    let tags: string[] = [];
    try {
      if (row.missing_ingredients) missing = JSON.parse(row.missing_ingredients);
    } catch (_err) {
      missing = [];
    }
    try {
      if (row.tags) tags = JSON.parse(row.tags);
    } catch (_err) {
      tags = [];
    }

    return {
      id: row.id,
      day: row.day,
      mealType: row.meal_type,
      recipeId: row.recipe_id || undefined,
      recipeName: row.recipe_name,
      prepTimeMinutes: row.prep_time_minutes,
      calories: row.calories,
      servings: row.servings,
      cooked: Boolean(row.cooked),
      missingIngredients: missing,
      tags,
      createdAt: row.created_at,
    };
  }
}

export const mealPlanService = new MealPlanService();
