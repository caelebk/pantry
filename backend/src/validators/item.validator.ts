import { CreateItemDTO, UpdateItemDTO } from '../models/data-models/item.model.ts';
import {
  isNonEmptyString,
  isPositiveNumber,
  isValidDate,
  isValidUUID,
} from '../utils/validators.ts';

/**
 * Validate CreateItemDTO
 */
export function isValidCreateItemDTO(data: CreateItemDTO): boolean {
  if (!data) return false;
  if (!isNonEmptyString(data.label)) return false;
  if (!isPositiveNumber(data.quantity)) return false;
  if (!isValidDate(data.expirationDate)) return false;
  if (!isValidDate(data.purchaseDate)) return false;

  if (data.ingredientId && !isValidUUID(data.ingredientId)) return false;
  if (data.openedDate && !isValidDate(data.openedDate)) return false;

  return true;
}

/**
 * Validate UpdateItemDTO
 */
export function isValidUpdateItemDTO(data: UpdateItemDTO): boolean {
  if (!data) return false;
  // For update, we might allow partial updates, but currently the interface suggests all fields are present except those marked optional (?)
  // Looking at the interface, label, quantity, unitId, locationId, expirationDate, purchaseDate are NOT optional.

  if (!isNonEmptyString(data.label)) return false;
  if (!isPositiveNumber(data.quantity)) return false;
  if (!isValidDate(data.expirationDate)) return false;
  if (!isValidDate(data.purchaseDate)) return false;

  if (data.ingredientId && !isValidUUID(data.ingredientId)) return false;
  if (data.openedDate && !isValidDate(data.openedDate)) return false;

  return true;
}
