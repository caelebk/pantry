export const ItemMessages = {
  FETCH_ALL_ERROR: 'Failed to fetch items',
  FETCH_EXPIRING_ERROR: 'Failed to fetch expiring soon items',
  NOT_FOUND: 'Item not found',
  INVALID_BODY: 'Invalid request body',
  DELETE_ERROR: 'Failed to delete item',
  DELETE_SUCCESS: (id: string) => `Item ${id} deleted`,

  // Service errors
  DB_RETRIEVE_ITEMS_ERROR: 'Failed to retrieve items from the database.',
  DB_RETRIEVE_ITEM_ERROR: 'Failed to retrieve item from the database.',
  DB_CREATE_ERROR: 'Failed to create item in the database.',
  DB_UPDATE_ERROR: 'Failed to update item in the database.',
  DB_DELETE_ERROR: 'Failed to delete item from the database.',
  DB_FIND_EXPIRING_ERROR: 'Failed to find expiring soon items from the database.',

  // Validation errors
  INVALID_DAYS: 'Invalid days parameter',
  INVALID_ID: 'Invalid ID format',
  INVALID_ID_FORMAT_LOG: (id: string) => `Invalid ID format: ${id}`,
};
