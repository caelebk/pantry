import { IngredientDTO } from '../models/data-models/ingredient.model.ts';
import { isNonEmptyString, isPositiveNumber } from '../utils/validators.ts';

/**
 * Validate Create Ingredient (using IngredientDTO for now)
 */
export function isValidCreateIngredientDTO(data: Partial<IngredientDTO>): boolean {
  if (!data) return false;
  if (!isNonEmptyString(data.name || '')) return false;

  if (data.categoryId !== undefined && !isPositiveNumber(data.categoryId)) return false;
  if (data.defaultUnitId !== undefined && !isPositiveNumber(data.defaultUnitId)) return false;

  return true;
}

/**
 * Validate Update Ingredient
 */
export function isValidUpdateIngredientDTO(data: Partial<IngredientDTO>): boolean {
  if (!data) return false;
  // For update, name must be string if provided, but usually PUT replaces the resource or we just validate what's there.
  // Assuming strict requirements similar to Create for now, or just validating properties if they exist.

  if (data.name !== undefined && !isNonEmptyString(data.name)) return false;
  if (data.categoryId !== undefined && !isPositiveNumber(data.categoryId)) return false;
  if (data.defaultUnitId !== undefined && !isPositiveNumber(data.defaultUnitId)) return false;

  return true;
}
