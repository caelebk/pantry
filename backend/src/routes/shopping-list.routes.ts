import { Context, Hono } from 'hono';
import {
  CreateShoppingListItemDTO,
  UpdateShoppingListItemDTO,
} from '../models/data-models/shopping-list.model.ts';
import {
  shoppingListBackendService,
  ShoppingListDuplicateError,
} from '../services/shopping-list.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';

import { authMiddleware } from '../middleware/auth.ts';

const shoppingList = new Hono();
shoppingList.use('*', authMiddleware);

// GET /api/shopping-list - Get all shopping list items
shoppingList.get('/', async (c: Context) => {
  try {
    const activeKitchenId = c.get('activeKitchenId') || '';
    const data = await shoppingListBackendService.getAllItems(activeKitchenId);
    return c.json(successResponse(data), HttpStatusCode.OK);
  } catch (error: unknown) {
    if (error instanceof ShoppingListDuplicateError) {
      return c.json(errorResponse(error.message), HttpStatusCode.CONFLICT);
    }
    console.error('Error fetching shopping list items:', error);
    return c.json(
      errorResponse('Failed to fetch shopping list items'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// POST /api/shopping-list - Add a new item
shoppingList.post('/', async (c: Context) => {
  try {
    const body: CreateShoppingListItemDTO = await c.req.json();
    if (!body || !body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return c.json(errorResponse('Item name is required'), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const created = await shoppingListBackendService.createItem(body, activeKitchenId, userId);
    return c.json(successResponse(created), HttpStatusCode.CREATED);
  } catch (error: unknown) {
    if (error instanceof ShoppingListDuplicateError) {
      return c.json(errorResponse(error.message), HttpStatusCode.CONFLICT);
    }
    console.error('Error creating shopping list item:', error);
    return c.json(
      errorResponse('Failed to create shopping list item'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// POST /api/shopping-list/bulk - Add multiple items
shoppingList.post('/bulk', async (c: Context) => {
  try {
    const body: CreateShoppingListItemDTO[] = await c.req.json();
    if (!Array.isArray(body)) {
      return c.json(errorResponse('Array of items required'), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const created = await shoppingListBackendService.createMultipleItems(
      body,
      activeKitchenId,
      userId,
    );
    return c.json(successResponse(created), HttpStatusCode.CREATED);
  } catch (error: unknown) {
    if (error instanceof ShoppingListDuplicateError) {
      return c.json(errorResponse(error.message), HttpStatusCode.CONFLICT);
    }
    console.error('Error creating multiple shopping list items:', error);
    return c.json(
      errorResponse('Failed to create shopping list items'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

shoppingList.get('/:id', async (c: Context) => {
  const item = await shoppingListBackendService.getItemById(
    c.req.param('id')!,
    c.get('activeKitchenId') || '',
  );
  return item
    ? c.json(successResponse(item), HttpStatusCode.OK)
    : c.json(errorResponse('Shopping list item not found'), HttpStatusCode.NOT_FOUND);
});

shoppingList.put('/bulk', async (c: Context) => {
  const body = await c.req.json<{ ids?: string[]; checked?: boolean }>();
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return c.json(errorResponse('ids are required'), HttpStatusCode.BAD_REQUEST);
  }
  const count = body.checked === false ? 0 : await shoppingListBackendService.markBought(
    body.ids,
    c.get('activeKitchenId') || '',
    c.get('user').userId,
  );
  return c.json(successResponse({ count }), HttpStatusCode.OK);
});

shoppingList.delete('/bulk', async (c: Context) => {
  const body = await c.req.json<{ ids?: string[] }>();
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return c.json(errorResponse('ids are required'), HttpStatusCode.BAD_REQUEST);
  }
  const count = await shoppingListBackendService.deleteItems(
    body.ids,
    c.get('activeKitchenId') || '',
  );
  return c.json(successResponse({ count }), HttpStatusCode.OK);
});

// PUT /api/shopping-list/:id - Update item
shoppingList.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    const body: UpdateShoppingListItemDTO = await c.req.json();
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const updated = await shoppingListBackendService.updateItem(id, activeKitchenId, body, userId);
    if (updated) {
      return c.json(successResponse(updated), HttpStatusCode.OK);
    }
    return c.json(errorResponse('Shopping list item not found'), HttpStatusCode.NOT_FOUND);
  } catch (error: unknown) {
    console.error('Error updating shopping list item:', error);
    return c.json(
      errorResponse('Failed to update shopping list item'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// DELETE /api/shopping-list/checked - Delete all checked items
shoppingList.delete('/checked', async (c: Context) => {
  try {
    const activeKitchenId = c.get('activeKitchenId') || '';
    const count = await shoppingListBackendService.deleteCheckedItems(activeKitchenId);
    return c.json(
      successResponse({ count, message: `Deleted ${count} checked items` }),
      HttpStatusCode.OK,
    );
  } catch (error: unknown) {
    console.error('Error clearing checked shopping list items:', error);
    return c.json(
      errorResponse('Failed to clear checked items'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// DELETE /api/shopping-list/:id - Delete single item
shoppingList.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    const activeKitchenId = c.get('activeKitchenId') || '';
    await shoppingListBackendService.deleteItem(id, activeKitchenId);
    return c.json(successResponse({ message: 'Item deleted successfully' }), HttpStatusCode.OK);
  } catch (error: unknown) {
    console.error('Error deleting shopping list item:', error);
    return c.json(errorResponse('Failed to delete item'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

export default shoppingList;
