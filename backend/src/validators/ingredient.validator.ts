import {
  CreateIngredientDTO,
  UpdateIngredientDTO,
} from '../models/data-models/ingredient.model.ts';
import { isNonEmptyString, isPositiveNumber, isValidUUID } from '../utils/validators.ts';

/**
 * Validate Create Ingredient (using IngredientDTO for now)
 */
export function isValidCreateIngredientDTO(data: Partial<CreateIngredientDTO>): boolean {
  if (!data) return false;
  if (!isNonEmptyString(data.name || '')) return false;

  if (data.categoryId !== undefined && !isPositiveNumber(data.categoryId)) return false;
  if (data.ingredientGroupId !== undefined && !isPositiveNumber(data.ingredientGroupId)) {
    return false;
  }
  if (data.defaultUnitId === undefined || !isPositiveNumber(data.defaultUnitId)) return false;

  return true;
}

/**
 * Validate Update Ingredient
 */
export function isValidUpdateIngredientDTO(data: Partial<UpdateIngredientDTO>): boolean {
  if (!data) return false;
  // For update, name must be string if provided, but usually PUT replaces the resource or we just validate what's there.
  // Assuming strict requirements similar to Create for now, or just validating properties if they exist.

  if (data.name !== undefined && !isNonEmptyString(data.name)) return false;
  if (data.categoryId !== undefined && !isPositiveNumber(data.categoryId)) return false;
  if (data.defaultUnitId !== undefined && !isPositiveNumber(data.defaultUnitId)) return false;

  return true;
}

/**
 * Validate Reconcile Units DTO
 */
export function isValidReconcileUnitsDTO(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const body = data as { newDefaultUnitId?: unknown; items?: unknown };

  if (typeof body.newDefaultUnitId !== 'number' || !isPositiveNumber(body.newDefaultUnitId)) {
    return false;
  }
  if (!Array.isArray(body.items)) return false;

  for (const item of body.items) {
    if (!item || typeof item !== 'object') return false;
    const { id, quantity } = item as { id?: unknown; quantity?: unknown };
    if (typeof id !== 'string' || !isValidUUID(id)) return false;
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) return false;
  }

  return true;
}
