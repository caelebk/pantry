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
  RecipeIngredientRow,
  RecipeRow,
  RecipeStepRow,
} from '../models/schema-models/recipe.model.ts';
import { isValidUUID } from '../utils/validators.ts';

export class RecipeService {
  /**
   * Retrieves all recipes from the database, optionally filtered by kitchen.
   */
  async getAllRecipes(kitchenId: string): Promise<RecipeDTO[]> {
    return await this.findAll(kitchenId);
  }

  findAll(kitchenId: string): Promise<RecipeDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare(`
          SELECT r.*, d.name as difficulty_name,
                 u_c.username as created_by_username, p_c.full_name as created_by_full_name,
                 u_u.username as updated_by_username, p_u.full_name as updated_by_full_name
          FROM recipes r
          LEFT JOIN difficulties d ON r.difficulty_id = d.id
          LEFT JOIN users u_c ON r.created_by = u_c.id
          LEFT JOIN profiles p_c ON u_c.id = p_c.user_id
          LEFT JOIN users u_u ON r.updated_by = u_u.id
          LEFT JOIN profiles p_u ON u_u.id = p_u.user_id
          WHERE r.kitchen_id = ?
          ORDER BY r.created_at DESC
        `).all(kitchenId) as (RecipeRow & {
        difficulty_name: string | null;
        created_by_username?: string | null;
        created_by_full_name?: string | null;
        updated_by_username?: string | null;
        updated_by_full_name?: string | null;
      })[];

      if (rows.length === 0) {
        return Promise.resolve([]);
      }

      // Batch fetch ingredients for recipes in this kitchen
      const allIngredients = db.prepare(`
        SELECT ri.* 
        FROM recipe_ingredients ri
        JOIN recipes r ON ri.recipe_id = r.id
        WHERE r.kitchen_id = ?
        ORDER BY ri.ingredient_order ASC, ri.created_at ASC
      `).all(kitchenId) as RecipeIngredientRow[];

      const ingredientsMap = new Map<string, RecipeIngredientDTO[]>();
      for (const r of allIngredients) {
        const dto: RecipeIngredientDTO = {
          recipeId: r.recipe_id,
          ingredientId: r.ingredient_id,
          quantity: r.quantity,
          unitId: r.unit_id,
          ingredientOrder: r.ingredient_order ?? 0,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        };
        const list = ingredientsMap.get(r.recipe_id) || [];
        list.push(dto);
        ingredientsMap.set(r.recipe_id, list);
      }

      // Batch fetch steps for recipes in this kitchen
      const allSteps = db.prepare(`
        SELECT rs.* 
        FROM recipe_steps rs
        JOIN recipes r ON rs.recipe_id = r.id
        WHERE r.kitchen_id = ?
        ORDER BY rs.step_number ASC
      `).all(kitchenId) as RecipeStepRow[];

      const stepsMap = new Map<string, RecipeStepDTO[]>();
      for (const s of allSteps) {
        const dto: RecipeStepDTO = {
          id: s.id,
          recipeId: s.recipe_id,
          stepNumber: s.step_number,
          instructionText: s.instruction_text,
          imageUrl: s.image_url ? s.image_url : undefined,
          timerSeconds: s.timer_seconds ? s.timer_seconds : undefined,
          textareaHeight: s.textarea_height != null ? Number(s.textarea_height) : undefined,
        };
        const list = stepsMap.get(s.recipe_id) || [];
        list.push(dto);
        stepsMap.set(s.recipe_id, list);
      }

      const recipes: RecipeDTO[] = rows.map((row) =>
        this.mapRowToDTO(
          row,
          ingredientsMap.get(row.id) || [],
          stepsMap.get(row.id) || [],
        )
      );
      return Promise.resolve(recipes);
    } catch (error: unknown) {
      console.error('Error fetching all recipes:', error);
      throw new Error(RecipeMessages.DB_RETRIEVE_RECIPES_ERROR);
    }
  }

  /**
   * Retrieves a single recipe by its ID.
   */
  async getRecipeById(id: string, kitchenId: string): Promise<RecipeDTO | null> {
    return await this.findById(id, kitchenId);
  }

  findById(id: string, kitchenId: string): Promise<RecipeDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(RecipeMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      const row = db.prepare(`
        SELECT r.*, d.name as difficulty_name,
               u_c.username as created_by_username, p_c.full_name as created_by_full_name,
               u_u.username as updated_by_username, p_u.full_name as updated_by_full_name
        FROM recipes r
        LEFT JOIN difficulties d ON r.difficulty_id = d.id
        LEFT JOIN users u_c ON r.created_by = u_c.id
        LEFT JOIN profiles p_c ON u_c.id = p_c.user_id
        LEFT JOIN users u_u ON r.updated_by = u_u.id
        LEFT JOIN profiles p_u ON u_u.id = p_u.user_id
        WHERE r.id = ? AND r.kitchen_id = ?
      `).get(id, kitchenId) as
        | (RecipeRow & {
          difficulty_name: string | null;
          created_by_username?: string | null;
          created_by_full_name?: string | null;
          updated_by_username?: string | null;
          updated_by_full_name?: string | null;
        })
        | undefined;

      if (!row) return Promise.resolve(null);

      const ingredients = this.getRecipeIngredients(row.id);
      const steps = this.getRecipeSteps(row.id);
      return Promise.resolve(this.mapRowToDTO(row, ingredients, steps));
    } catch (error: unknown) {
      console.error('Error fetching recipe by ID:', error);
      throw new Error(RecipeMessages.DB_RETRIEVE_RECIPE_ERROR);
    }
  }

  /**
   * Creates a new recipe in the database.
   */
  async createRecipe(data: CreateRecipeDTO, kitchenId: string, userId: string): Promise<RecipeDTO> {
    return await this.create(data, kitchenId, userId);
  }

  async create(data: CreateRecipeDTO, kitchenId: string, userId: string): Promise<RecipeDTO> {
    const db = getDB();
    const recipeId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      db.exec('BEGIN');

      db.prepare(`
        INSERT INTO recipes (id, name, description, difficulty_id, servings, prep_time, cook_time, image_url, kitchen_id, created_at, updated_at, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        recipeId,
        data.name,
        data.description ?? null,
        data.difficultyId ?? null,
        data.servings ?? null,
        data.prepTime ?? null,
        data.cookTime ?? null,
        data.imageUrl ?? null,
        kitchenId,
        now,
        now,
        userId,
        userId,
      );

      if (data.ingredients && data.ingredients.length > 0) {
        const insertIngredient = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, ingredient_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        data.ingredients.forEach((ing, index) => {
          const order = ing.ingredientOrder ??
            (ing as RecipeIngredientDTO & { ingredient_order?: number }).ingredient_order ??
            (index + 1);
          insertIngredient.run(
            recipeId,
            ing.ingredientId,
            ing.quantity,
            ing.unitId ?? null,
            order,
            now,
            now,
          );
        });
      }

      if (data.steps && data.steps.length > 0) {
        const insertStep = db.prepare(`
          INSERT INTO recipe_steps (id, recipe_id, step_number, instruction_text, image_url, timer_seconds, textarea_height)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        data.steps.forEach((step, index) => {
          const stepId = crypto.randomUUID();
          const stepNumber = step.stepNumber ?? step.step_number ?? (index + 1);
          const instructionText = step.instructionText ?? step.instruction_text ?? '';
          const textareaHeight = step.textareaHeight ?? step.textarea_height ?? null;
          insertStep.run(
            stepId,
            recipeId,
            stepNumber,
            instructionText,
            step.imageUrl ?? null,
            step.timerSeconds ?? null,
            textareaHeight,
          );
        });
      }

      db.exec('COMMIT');
      return (await this.findById(recipeId, kitchenId))!;
    } catch (error: unknown) {
      db.exec('ROLLBACK');
      console.error('Error creating recipe:', error);
      throw new Error(RecipeMessages.DB_CREATE_ERROR);
    }
  }

  /**
   * Updates an existing recipe in the database.
   */
  async updateRecipe(
    id: string,
    kitchenId: string,
    data: UpdateRecipeDTO,
    userId: string,
  ): Promise<RecipeDTO | null> {
    return await this.update(id, kitchenId, data, userId);
  }

  async update(
    id: string,
    kitchenId: string,
    data: UpdateRecipeDTO,
    userId: string,
  ): Promise<RecipeDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(RecipeMessages.INVALID_ID_FORMAT_LOG(id));
    }
    const db = getDB();
    const existing = await this.findById(id, kitchenId);
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
            image_url = COALESCE(?, image_url),
            updated_by = ?
        WHERE id = ? AND kitchen_id = ?
      `).run(
        data.name ?? null,
        data.description ?? null,
        data.difficultyId ?? null,
        data.servings ?? null,
        data.prepTime ?? null,
        data.cookTime ?? null,
        data.imageUrl ?? null,
        userId,
        id,
        kitchenId,
      );

      if (data.ingredients) {
        db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(id);
        const now = new Date().toISOString();
        const insertIngredient = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit_id, ingredient_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        data.ingredients.forEach((ing, index) => {
          const order = ing.ingredientOrder ??
            (ing as RecipeIngredientDTO & { ingredient_order?: number }).ingredient_order ??
            (index + 1);
          insertIngredient.run(
            id,
            ing.ingredientId,
            ing.quantity,
            ing.unitId ?? null,
            order,
            now,
            now,
          );
        });
      }

      if (data.steps) {
        db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(id);
        const insertStep = db.prepare(`
          INSERT INTO recipe_steps (id, recipe_id, step_number, instruction_text, image_url, timer_seconds, textarea_height)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        data.steps.forEach((step, index) => {
          const stepId = crypto.randomUUID();
          const stepNumber = step.stepNumber ?? step.step_number ?? (index + 1);
          const instructionText = step.instructionText ?? step.instruction_text ?? '';
          const textareaHeight = step.textareaHeight ?? step.textarea_height ?? null;
          insertStep.run(
            stepId,
            id,
            stepNumber,
            instructionText,
            step.imageUrl ?? null,
            step.timerSeconds ?? null,
            textareaHeight,
          );
        });
      }

      db.exec('COMMIT');
      return await this.findById(id, kitchenId);
    } catch (error: unknown) {
      db.exec('ROLLBACK');
      console.error('Error updating recipe:', error);
      throw new Error(RecipeMessages.DB_UPDATE_ERROR);
    }
  }

  /**
   * Deletes a recipe from the database by its ID.
   */
  async deleteRecipe(id: string, kitchenId: string): Promise<boolean> {
    return await this.delete(id, kitchenId);
  }

  delete(id: string, kitchenId: string): Promise<boolean> {
    if (!isValidUUID(id)) {
      throw new Error(RecipeMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      db.prepare('DELETE FROM recipes WHERE id = ? AND kitchen_id = ?').run(id, kitchenId);
      return Promise.resolve(true);
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
  async getAvailableRecipes(kitchenId: string): Promise<RecipeDTO[]> {
    try {
      const db = getDB();

      // 1. Calculate available base quantities per ingredient in pantry
      // items joined with units to get to_base_factor (excluding expired items)
      const pantryRows = db.prepare(`
        SELECT i.ingredient_id, i.quantity, COALESCE(u.to_base_factor, 1.0) as to_base_factor
        FROM ingredient_items i
        LEFT JOIN units u ON i.unit_id = u.id
        WHERE i.ingredient_id IS NOT NULL
          AND i.kitchen_id = ?
          AND (i.expiration_date IS NULL OR datetime(i.expiration_date) >= datetime('now'))
      `).all(kitchenId) as { ingredient_id: string; quantity: number; to_base_factor: number }[];

      const availableMap = new Map<string, number>();
      for (const row of pantryRows) {
        const baseQty = row.quantity * row.to_base_factor;
        availableMap.set(row.ingredient_id, (availableMap.get(row.ingredient_id) || 0) + baseQty);
      }

      // 2. Fetch all recipes & unit factors
      const allRecipes = await this.findAll(kitchenId);
      const unitRows = db.prepare(
        'SELECT id, COALESCE(to_base_factor, 1.0) as to_base_factor FROM units',
      ).all() as { id: number; to_base_factor: number }[];
      const unitFactorMap = new Map<number, number>();
      for (const u of unitRows) {
        unitFactorMap.set(u.id, u.to_base_factor);
      }

      // 3. Filter recipes where available quantity >= required quantity for all ingredients
      const makeableRecipes = allRecipes.filter((recipe) => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
          return true; // No ingredients required -> available
        }

        for (const reqIng of recipe.ingredients) {
          const factor = reqIng.unitId ? (unitFactorMap.get(reqIng.unitId) ?? 1.0) : 1.0;
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

  async findMakeable(_availableItemIds: string[], kitchenId: string): Promise<RecipeDTO[]> {
    return await this.getAvailableRecipes(kitchenId);
  }

  private getRecipeIngredients(recipeId: string): RecipeIngredientDTO[] {
    const db = getDB();
    const rows = db.prepare(`
      SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY ingredient_order ASC, created_at ASC
    `).all(recipeId) as RecipeIngredientRow[];

    return rows.map((r) => ({
      recipeId: r.recipe_id,
      ingredientId: r.ingredient_id,
      quantity: r.quantity,
      unitId: r.unit_id,
      ingredientOrder: r.ingredient_order ?? 0,
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
      textareaHeight: s.textarea_height != null ? Number(s.textarea_height) : undefined,
    }));
  }

  private mapRowToDTO(
    row: RecipeRow & {
      difficulty_name?: string | null;
      created_by_username?: string | null;
      created_by_full_name?: string | null;
      updated_by_username?: string | null;
      updated_by_full_name?: string | null;
    },
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
      createdBy: row.created_by
        ? {
          id: row.created_by,
          username: row.created_by_username || undefined,
          fullName: row.created_by_full_name || undefined,
        }
        : undefined,
      updatedBy: row.updated_by
        ? {
          id: row.updated_by,
          username: row.updated_by_username || undefined,
          fullName: row.updated_by_full_name || undefined,
        }
        : undefined,
    };
  }
}

export const recipeService = new RecipeService();
