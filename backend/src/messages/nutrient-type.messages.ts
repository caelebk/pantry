import { CommonMessages } from './common.messages.ts';

export const NutrientTypeMessages = {
  ...CommonMessages,
  NOT_FOUND: 'Nutrient type not found',

  // Service errors
  DB_RETRIEVE_NUTRIENT_TYPES_ERROR: 'Failed to retrieve nutrient types from the database.',
  DB_RETRIEVE_NUTRIENT_TYPE_ERROR: 'Failed to retrieve nutrient type from the database.',
};
