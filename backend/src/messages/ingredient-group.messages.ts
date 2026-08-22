import { CommonMessages } from './common.messages.ts';

export const IngredientGroupMessages = {
  ...CommonMessages,
  NOT_FOUND: 'Ingredient group not found',

  // Service errors
  DB_RETRIEVE_GROUPS_ERROR: 'Failed to retrieve ingredient groups from the database.',
  DB_RETRIEVE_GROUP_ERROR: 'Failed to retrieve ingredient group from the database.',
  DB_CREATE_GROUP_ERROR: 'Failed to create ingredient group in the database.',
  DB_UPDATE_GROUP_ERROR: 'Failed to update ingredient group in the database.',
  DB_DELETE_GROUP_ERROR: 'Failed to delete ingredient group from the database.',
};
