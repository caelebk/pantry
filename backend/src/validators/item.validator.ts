import { CreateItemDTO, UpdateItemDTO } from '../models/data-models/item.model.ts';
import {
  isNonEmptyString,
  isNonNegativeNumber,
  isValidDate,
  isValidUUID,
} from '../utils/validators.ts';

/**
 * Validate CreateItemDTO
 */
export function isValidCreateItemDTO(data: Partial<CreateItemDTO>): boolean {
  if (!data) return false;
  if (!data.label || !isNonEmptyString(data.label)) return false;
  if (data.quantity === undefined || !isNonNegativeNumber(data.quantity)) return false;
  if (data.expirationDate && !isValidDate(data.expirationDate)) return false;
  if (!data.purchaseDate || !isValidDate(data.purchaseDate)) return false;

  if (
    data.ingredientId !== undefined && data.ingredientId !== null && !isValidUUID(data.ingredientId)
  ) return false;
  if (data.openedDate && !isValidDate(data.openedDate)) return false;

  return true;
}

/**
 * Validate UpdateItemDTO
 * Use Partial to handle optional fields for updates
 */
export function isValidUpdateItemDTO(data: UpdateItemDTO): boolean {
  if (!data) return false;

  if (data.label !== undefined && !isNonEmptyString(data.label)) return false;
  if (data.quantity !== undefined && !isNonNegativeNumber(data.quantity)) return false;
  if (
    data.expirationDate !== undefined && data.expirationDate !== null &&
    !isValidDate(data.expirationDate)
  ) return false;
  if (data.purchaseDate !== undefined && !isValidDate(data.purchaseDate)) return false;

  if (
    data.ingredientId !== undefined && data.ingredientId !== null && !isValidUUID(data.ingredientId)
  ) return false;
  if (data.openedDate !== undefined && data.openedDate !== null && !isValidDate(data.openedDate)) {
    return false;
  }

  return true;
}

/**
 * Validate bulk IDs DTO payload
 */
export function isValidBulkIdsDTO(data: unknown): data is { ids: string[] } {
  if (!data || typeof data !== 'object') return false;
  const obj = data as { ids?: unknown };
  if (!Array.isArray(obj.ids) || obj.ids.length === 0) return false;
  return obj.ids.every((id) => typeof id === 'string' && isValidUUID(id));
}
