import { isNonEmptyString } from '../utils/validators.ts';
/** Omission preserves a parent; explicit null clears the assignment. */
export function isValidUpdateIngredientGroupDTO(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const body = data as { name?: unknown; ingredientCategoryId?: unknown };
  if (body.name !== undefined && (typeof body.name !== 'string' || !isNonEmptyString(body.name))) {
    return false;
  }
  const id = body.ingredientCategoryId;
  return id === undefined || id === null ||
    (typeof id === 'number' && Number.isInteger(id) && id > 0);
}
