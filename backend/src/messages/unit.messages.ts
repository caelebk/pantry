import { CommonMessages } from './common.messages.ts';

export const UnitMessages = {
  ...CommonMessages,
  // Custom unit errors
  INVALID_CONVERSION_TYPE: 'Cannot convert between different unit types (e.g. weight vs volume)',

  // Service errors
  DB_RETRIEVE_UNITS_ERROR: 'Failed to retrieve units from the database.',
  DB_RETRIEVE_UNIT_ERROR: 'Failed to retrieve unit from the database.',
};
