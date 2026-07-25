import { CommonMessages } from './common.messages.ts';

export const RecipeMessages = {
  ...CommonMessages,
  FETCH_ALL_ERROR: 'Failed to fetch recipes',
  FETCH_AVAILABLE_ERROR: 'Failed to fetch available recipes',
  DELETE_ERROR: 'Failed to delete recipe',
  DELETE_SUCCESS: (id: string) => `Recipe ${id} deleted`,
  NOT_FOUND: 'Recipe not found',

  // Service errors
  DB_RETRIEVE_RECIPES_ERROR: 'Failed to retrieve recipes from the database.',
  DB_RETRIEVE_RECIPE_ERROR: 'Failed to retrieve recipe from the database.',
  DB_CREATE_ERROR: 'Failed to create recipe in the database.',
  DB_UPDATE_ERROR: 'Failed to update recipe in the database.',
  DB_DELETE_ERROR: 'Failed to delete recipe from the database.',
  DB_FIND_AVAILABLE_ERROR: 'Failed to find available recipes from the database.',

  // Validation errors
  INVALID_ID_FORMAT_LOG: (id: string) => `Invalid ID format: ${id}`,
};
