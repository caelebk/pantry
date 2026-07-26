import { CommonMessages } from './common.messages.ts';

export const IngredientCategoryMessages = {
  ...CommonMessages,
  NOT_FOUND: 'Ingredient category not found',

  // Service errors
  DB_RETRIEVE_INGREDIENT_CATEGORIES_ERROR: 'Failed to retrieve ingredient categories from the database.',
  DB_RETRIEVE_INGREDIENT_CATEGORY_ERROR: 'Failed to retrieve ingredient category from the database.',
};

// Legacy alias export
export const NutrientTypeMessages = IngredientCategoryMessages;
