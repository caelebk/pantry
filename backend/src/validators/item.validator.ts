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
 * Use Partial to handle optional fields for updates
 */
export function isValidUpdateItemDTO(data: UpdateItemDTO): boolean {
  if (!data) return false;

  if (data.label !== undefined && !isNonEmptyString(data.label)) return false;
  if (data.quantity !== undefined && !isPositiveNumber(data.quantity)) return false;
  if (data.expirationDate !== undefined && !isValidDate(data.expirationDate)) return false;
  if (data.purchaseDate !== undefined && !isValidDate(data.purchaseDate)) return false;

  if (data.ingredientId !== undefined && !isValidUUID(data.ingredientId)) return false;
  if (data.openedDate !== undefined && !isValidDate(data.openedDate)) return false;

  return true;
}
