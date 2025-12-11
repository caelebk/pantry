import { CommonMessages } from './common.messages.ts';

export const CategoryMessages = {
  ...CommonMessages,
  NOT_FOUND: 'Category not found',

  // Service errors
  DB_RETRIEVE_CATEGORIES_ERROR: 'Failed to retrieve categories from the database.',
  DB_RETRIEVE_CATEGORY_ERROR: 'Failed to retrieve category from the database.',
};
