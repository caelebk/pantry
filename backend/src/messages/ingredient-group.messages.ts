import { CommonMessages } from './common.messages.ts';

export const IngredientGroupMessages = {
  ...CommonMessages,
  NOT_FOUND: 'Ingredient group not found',

  // Service errors
  DB_RETRIEVE_CATEGORIES_ERROR: 'Failed to retrieve ingredient groups from the database.',
  DB_RETRIEVE_CATEGORY_ERROR: 'Failed to retrieve ingredient group from the database.',
  DB_CREATE_CATEGORY_ERROR: 'Failed to create ingredient group in the database.',
  DB_UPDATE_CATEGORY_ERROR: 'Failed to update ingredient group in the database.',
  DB_DELETE_CATEGORY_ERROR: 'Failed to delete ingredient group from the database.',
};
