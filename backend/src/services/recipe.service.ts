/**
 * Recipe service - Business logic for recipe operations
 */

import { getDB } from '../db/client.ts';
import { RecipeMessages } from '../messages/recipe.messages.ts';
import type {
  CreateRecipeDTO,
  RecipeDTO,
  RecipeIngredientDTO,
  RecipeStepDTO,
  UpdateRecipeDTO,
} from '../models/data-models/recipe.model.ts';
import type {
  DifficultyRow,
  RecipeIngredientRow,
  RecipeRow,
  RecipeStepRow,
} from '../models/schema-models/recipe.model.ts';
import { isValidUUID } from '../utils/validators.ts';

export class RecipeService {
  /**
   * Retrieves all recipes from the database.
   */
  async getAllRecipes(): Promise<RecipeDTO[]> {
    return await this.findAll();
  }

  async findAll(): Promise<RecipeDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare(`
        SELECT r.*, d.name as difficulty_name
        FROM recipes r
        LEFT JOIN difficulties d ON r.difficulty_id = d.id
        ORDER BY r.created_at DESC
      `).all() as (RecipeRow & { difficulty_name: string | null })[];

      const recipes: RecipeDTO[] = [];
      for (const row of rows) {
        const ingredients = this.getRecipeIngredients(row.id);
        const steps = this.getRecipeSteps(row.id);
        recipes.push(this.mapRowToDTO(row, ingredients, steps));
      }
      return recipes;
    } catch (error: unknown) {
      console.error('Error fetching all recipes:', error);
      throw new Error(RecipeMessages.DB_RETRIEVE_RECIPES_ERROR);
    }
  }

  /**
   * Retrieves a single recipe by its ID.
   */
  async getRecipeById(id: string): Promise<RecipeDTO | null> {
    return await this.findById(id);
  }

  async findById(id: string): Promise<RecipeDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(RecipeMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      const row = db.prepare(`
        SELECT r.*, d.name as difficulty_name
        FROM recipes r
        LEFT JOIN difficulties d ON r.difficulty_id = d.id
        WHERE r.id = ?
      `).get(id) as (RecipeRow & { difficulty_name: string | null }) | undefined;

      if (!row) return null;

      const ingredients = this.getRecipeIngredients(row.id);
      const steps = this.getRecipeSteps(row.id);
      return this.mapRowToDTO(row, ingredients, steps);
    } catch (error: unknown) {
      console.error('Error fetching recipe by ID:', error);
      throw new Error(RecipeMessages.DB_RETRIEVE_RECIPE_ERROR);
    }
  }

  /**
   * Creates a new recipe in the database.
   */
  async createRecipe(data: CreateRecipeDTO): Promise<RecipeDTO> {
    return await this.create(data);
  }

  async create(data: CreateRecipeDTO): Promise<RecipeDTO> {
    const db = getDB();
    const recipeId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      db.exec('BEGIN');

      db.prepare(`
        INSERT INTO recipes (id, name, description, difficulty_id, servings, prep_time, cook_time, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        recipeId,
        data.name,
        data.description ?? null,
        data.difficultyId ?? null,
        data.servings ?? null,
        data.prepTime ?? null,
        data.cookTime ?? null,
        data.imageUrl ?? null,
        now,
        now,
      );

      if (data.ingredients && data.ingredients.length > 0) {
        const insertIngredient = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const ing of data.ingredients) {
          insertIngredient.run(
            recipeId,
            ing.ingredientId,
            ing.quantity,
            ing.unitId ?? null,
            now,
            now,
          );
        }
      }

      if (data.steps && data.steps.length > 0) {
        const insertStep = db.prepare(`
          INSERT INTO recipe_steps (id, recipe_id, step_number, instruction_text, image_url, timer_seconds)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const step of data.steps) {
          const stepId = crypto.randomUUID();
          const stepNumber = step.stepNumber ?? step.step_number ?? 1;
          const instructionText = step.instructionText ?? step.instruction_text ?? '';
          insertStep.run(
            stepId,
            recipeId,
            stepNumber,
            instructionText,
            step.imageUrl ?? null,
            step.timerSeconds ?? null,
          );
        }
      }

      db.exec('COMMIT');
      return (await this.findById(recipeId))!;
    } catch (error: unknown) {
      db.exec('ROLLBACK');
      console.error('Error creating recipe:', error);
      throw new Error(RecipeMessages.DB_CREATE_ERROR);
    }
  }

  /**
   * Updates an existing recipe in the database.
   */
  async updateRecipe(id: string, data: UpdateRecipeDTO): Promise<RecipeDTO | null> {
    return await this.update(id, data);
  }

  async update(id: string, data: UpdateRecipeDTO): Promise<RecipeDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(RecipeMessages.INVALID_ID_FORMAT_LOG(id));
    }
    const db = getDB();
    const existing = await this.findById(id);
    if (!existing) return null;

    try {
      db.exec('BEGIN');

      db.prepare(`
        UPDATE recipes
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            difficulty_id = COALESCE(?, difficulty_id),
            servings = COALESCE(?, servings),
            prep_time = COALESCE(?, prep_time),
            cook_time = COALESCE(?, cook_time),
            image_url = COALESCE(?, image_url)
        WHERE id = ?
      `).run(
        data.name ?? null,
        data.description ?? null,
        data.difficultyId ?? null,
        data.servings ?? null,
        data.prepTime ?? null,
        data.cookTime ?? null,
        data.imageUrl ?? null,
        id,
      );

      if (data.ingredients) {
        db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id);
        const now = new Date().toISOString();
        const insertIngredient = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const ing of data.ingredients) {
          insertIngredient.run(id, ing.ingredientId, ing.quantity, ing.unitId ?? null, now, now);
        }
      }

      if (data.steps) {
        db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(id);
        const insertStep = db.prepare(`
          INSERT INTO recipe_steps (id, recipe_id, step_number, instruction_text, image_url, timer_seconds)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const step of data.steps) {
          const stepId = crypto.randomUUID();
          const stepNumber = step.stepNumber ?? step.step_number ?? 1;
          const instructionText = step.instructionText ?? step.instruction_text ?? '';
          insertStep.run(
            stepId,
            id,
            stepNumber,
            instructionText,
            step.imageUrl ?? null,
            step.timerSeconds ?? null,
          );
        }
      }

      db.exec('COMMIT');
      return await this.findById(id);
    } catch (error: unknown) {
      db.exec('ROLLBACK');
      console.error('Error updating recipe:', error);
      throw new Error(RecipeMessages.DB_UPDATE_ERROR);
    }
  }

  /**
   * Deletes a recipe from the database by its ID.
   */
  async deleteRecipe(id: string): Promise<boolean> {
    return await this.delete(id);
  }

  async delete(id: string): Promise<boolean> {
    if (!isValidUUID(id)) {
      throw new Error(RecipeMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
      return true;
    } catch (error: unknown) {
      console.error('Error deleting recipe:', error);
      throw new Error(RecipeMessages.DB_DELETE_ERROR);
    }
  }

  /**
   * Retrieves available recipes based on items in pantry inventory.
   * Logic:
   * 1. Sum available pantry quantity by ingredient_id (converting to base units using unit factor).
   * 2. Calculate required recipe quantity by ingredient_id (converting to base units using unit factor).
   * 3. Filter recipes where pantry_base_qty >= recipe_base_qty for ALL required ingredients.
   */
  async getAvailableRecipes(): Promise<RecipeDTO[]> {
    try {
      const db = getDB();

      // 1. Calculate available base quantities per ingredient in pantry
      // items joined with units to get to_base_factor (excluding expired items)
      const pantryRows = db.prepare(`
        SELECT i.ingredient_id, i.quantity, COALESCE(u.to_base_factor, 1.0) as to_base_factor
        FROM ingredient_items i
        LEFT JOIN units u ON i.unit_id = u.id
        WHERE i.ingredient_id IS NOT NULL
          AND (i.expiration_date IS NULL OR datetime(i.expiration_date) >= datetime('now'))
      `).all() as { ingredient_id: string; quantity: number; to_base_factor: number }[];

      const availableMap = new Map<string, number>();
      for (const row of pantryRows) {
        const baseQty = row.quantity * row.to_base_factor;
        availableMap.set(row.ingredient_id, (availableMap.get(row.ingredient_id) || 0) + baseQty);
      }

      // 2. Fetch all recipes
      const allRecipes = await this.findAll();

      // 3. Filter recipes where available quantity >= required quantity for all ingredients
      const makeableRecipes = allRecipes.filter((recipe) => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
          return true; // No ingredients required -> available
        }

        for (const reqIng of recipe.ingredients) {
          // Get unit base factor for required ingredient
          let factor = 1.0;
          if (reqIng.unitId) {
            const unitRow = db.prepare('SELECT to_base_factor FROM units WHERE id = ?').get(
              reqIng.unitId,
            ) as { to_base_factor: number } | undefined;
            if (unitRow) {
              factor = unitRow.to_base_factor;
            }
          }
          const requiredBaseQty = reqIng.quantity * factor;
          const availableBaseQty = availableMap.get(reqIng.ingredientId) || 0;

          // Epsilon margin for floating-point comparison
          if (availableBaseQty < requiredBaseQty - 1e-6) {
            return false;
          }
        }
        return true;
      });

      return makeableRecipes;
    } catch (error: unknown) {
      console.error('Error finding available recipes:', error);
      throw new Error(RecipeMessages.DB_FIND_AVAILABLE_ERROR);
    }
  }

  async findMakeable(_availableItemIds: string[]): Promise<RecipeDTO[]> {
    return await this.getAvailableRecipes();
  }

  private getRecipeIngredients(recipeId: string): RecipeIngredientDTO[] {
    const db = getDB();
    const rows = db.prepare(`
      SELECT * FROM recipe_ingredients WHERE recipe_id = ?
    `).all(recipeId) as RecipeIngredientRow[];

    return rows.map((r) => ({
      recipeId: r.recipe_id,
      ingredientId: r.ingredient_id,
      quantity: r.quantity,
      unitId: r.unit_id,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    }));
  }

  private getRecipeSteps(recipeId: string): RecipeStepDTO[] {
    const db = getDB();
    const rows = db.prepare(`
      SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC
    `).all(recipeId) as RecipeStepRow[];

    return rows.map((s) => ({
      id: s.id,
      recipeId: s.recipe_id,
      stepNumber: s.step_number,
      instructionText: s.instruction_text,
      imageUrl: s.image_url ? s.image_url : undefined,
      timerSeconds: s.timer_seconds ? s.timer_seconds : undefined,
    }));
  }

  private mapRowToDTO(
    row: RecipeRow & { difficulty_name?: string | null },
    ingredients: RecipeIngredientDTO[],
    steps: RecipeStepDTO[],
  ): RecipeDTO {
    return {
      id: row.id,
      name: row.name,
      description: row.description ? row.description : undefined,
      difficultyId: row.difficulty_id ? row.difficulty_id : undefined,
      difficulty: row.difficulty_name ? row.difficulty_name : undefined,
      servings: row.servings ? row.servings : undefined,
      prepTime: row.prep_time ? row.prep_time : undefined,
      cookTime: row.cook_time ? row.cook_time : undefined,
      imageUrl: row.image_url ? row.image_url : undefined,
      ingredients,
      steps,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const recipeService = new RecipeService();
