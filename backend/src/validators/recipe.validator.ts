import { CreateRecipeDTO, UpdateRecipeDTO } from '../models/data-models/recipe.model.ts';
import { isNonEmptyString, isPositiveNumber, isValidUUID } from '../utils/validators.ts';

export function isValidCreateRecipeDTO(data: Partial<CreateRecipeDTO>): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!isNonEmptyString(data.name || '')) return false;

  if (data.servings !== undefined && !isPositiveNumber(data.servings)) return false;
  if (data.prepTime !== undefined && !isPositiveNumber(data.prepTime)) return false;
  if (data.cookTime !== undefined && !isPositiveNumber(data.cookTime)) return false;
  if (data.difficultyId !== undefined && !isPositiveNumber(data.difficultyId)) return false;

  if (data.ingredients !== undefined) {
    if (!Array.isArray(data.ingredients)) return false;
    for (const ing of data.ingredients) {
      if (!ing || typeof ing !== 'object') return false;
      if (!isValidUUID(ing.ingredientId)) return false;
      if (typeof ing.quantity !== 'number' || isNaN(ing.quantity) || ing.quantity <= 0) {
        return false;
      }
      if (ing.unitId !== undefined && ing.unitId !== null && !isPositiveNumber(ing.unitId)) {
        return false;
      }
    }
  }

  if (data.steps !== undefined) {
    if (!Array.isArray(data.steps)) return false;
    for (const step of data.steps) {
      if (!step || typeof step !== 'object') return false;
      const text = step.instructionText ??
        (step as unknown as { instruction_text?: string }).instruction_text;
      if (!isNonEmptyString(text || '')) return false;
    }
  }

  return true;
}

export function isValidUpdateRecipeDTO(data: Partial<UpdateRecipeDTO>): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.name !== undefined && !isNonEmptyString(data.name)) return false;
  if (data.servings !== undefined && !isPositiveNumber(data.servings)) return false;
  if (data.prepTime !== undefined && !isPositiveNumber(data.prepTime)) return false;
  if (data.cookTime !== undefined && !isPositiveNumber(data.cookTime)) return false;

  return true;
}
