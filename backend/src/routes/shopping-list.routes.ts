import { Context, Hono } from 'hono';
import {
  CreateShoppingListItemDTO,
  UpdateShoppingListItemDTO,
} from '../models/data-models/shopping-list.model.ts';
import { shoppingListBackendService } from '../services/shopping-list.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';

const shoppingList = new Hono();

// GET /api/shopping-list - Get all shopping list items
shoppingList.get('/', async (c: Context) => {
  try {
    const data = await shoppingListBackendService.getAllItems();
    return c.json(successResponse(data), HttpStatusCode.OK);
  } catch (error: unknown) {
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
    const created = await shoppingListBackendService.createItem(body);
    return c.json(successResponse(created), HttpStatusCode.CREATED);
  } catch (error: unknown) {
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
    const created = await shoppingListBackendService.createMultipleItems(body);
    return c.json(successResponse(created), HttpStatusCode.CREATED);
  } catch (error: unknown) {
    console.error('Error creating multiple shopping list items:', error);
    return c.json(
      errorResponse('Failed to create shopping list items'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// PUT /api/shopping-list/:id - Update item
shoppingList.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    const body: UpdateShoppingListItemDTO = await c.req.json();
    const updated = await shoppingListBackendService.updateItem(id, body);
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
    const count = await shoppingListBackendService.deleteCheckedItems();
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
    await shoppingListBackendService.deleteItem(id);
    return c.json(successResponse({ message: 'Item deleted successfully' }), HttpStatusCode.OK);
  } catch (error: unknown) {
    console.error('Error deleting shopping list item:', error);
    return c.json(errorResponse('Failed to delete item'), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

export default shoppingList;
