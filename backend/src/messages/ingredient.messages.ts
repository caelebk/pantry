import { CommonMessages } from './common.messages.ts';

export const IngredientMessages = {
  ...CommonMessages,
  NOT_FOUND: 'Ingredient not found',

  // Service errors
  DB_RETRIEVE_ITEMS_ERROR: 'Failed to retrieve ingredients from the database.',
  DB_RETRIEVE_ITEM_ERROR: 'Failed to retrieve ingredient from the database.',
  DB_CREATE_ITEM_ERROR: 'Failed to create ingredient in the database.',
  DB_UPDATE_ITEM_ERROR: 'Failed to update ingredient in the database.',
  DB_DELETE_ITEM_ERROR: 'Failed to delete ingredient from the database.',

  // Validation errors
  INVALID_ID_FORMAT_LOG: (id: string) => `Invalid ID format: ${id}`,
};
