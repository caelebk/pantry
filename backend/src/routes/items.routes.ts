/**
 * Items API routes
 */
import { Context, Hono } from 'hono';
import { ItemMessages } from '../messages/item.messages.ts';
import { CreateItemDTO, ItemDTO, UpdateItemDTO } from '../models/data-models/item.model.ts';
import { itemService } from '../services/items/item.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber, isValidUUID } from '../utils/validators.ts';
import { isValidCreateItemDTO, isValidUpdateItemDTO } from '../validators/item.validator.ts';

const items = new Hono();

/**
 * GET /api/items
 * @summary Get all items
 * @returns {object} 200 - An array of items
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
items.get('/', async (c: Context) => {
  try {
    const items: ItemDTO[] = await itemService.getAllItems();
    return c.json(successResponse(items), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_ALL_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/items/expiring-soon
 * @summary Get items expiring soon
 * @param {number} days.query - The number of days to look ahead for expiring items
 * @returns {object} 200 - An array of items expiring soon
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
items.get('/expiring-soon', async (c: Context) => {
  try {
    const daysStr: string | undefined = c.req.query('days');
    const days: number = daysStr ? parseInt(daysStr) : NaN;

    if (daysStr && !isPositiveNumber(days)) {
      return c.json(errorResponse(ItemMessages.INVALID_DAYS), HttpStatusCode.BAD_REQUEST);
    }

    const items: ItemDTO[] = isNaN(days)
      ? await itemService.findExpiringSoon()
      : await itemService.findExpiringSoon(days);

    const response = successResponse(items);
    return c.json(response, HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_EXPIRING_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/items/:id
 * @summary Get item by ID
 * @param {string} id.path - The ID of the item to retrieve
 * @returns {object} 200 - The item with the specified ID
 * @returns {object} 404 - Item not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "id": "123" }
 * }
 */
items.get('/:id', async (c: Context) => {
  const id = c.req.param('id');
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  const item: ItemDTO | null = await itemService.getItemById(id);

  if (item) {
    return c.json(successResponse(item), HttpStatusCode.OK);
  } else {
    return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
  }
});

/**
 * POST /api/items
 * @summary Create a new item
 * @param {CreateItemDTO} request.body.required - The item to create
 * @returns {object} 201 - The created item
 * @returns {object} 400 - Invalid request body
 * @example request - example payload
 * {
 *   "name": "New Item",
 *   "description": "A description",
 *   "quantity": 10
 * }
 * @example response - 201 - success
 * {
 *   "status": "201",
 *   "data": { "name": "New Item", "description": "A description", "quantity": 10 }
 * }
 */
items.post('/', async (c: Context) => {
  try {
    const body = await c.req.json<CreateItemDTO>();
    if (!isValidCreateItemDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const item: ItemDTO = await itemService.createItem(body);

    return c.json(successResponse(item), HttpStatusCode.CREATED);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
  }
});

/**
 * PUT /api/items/:id
 * @summary Update an existing item
 * @param {string} id.path - The ID of the item to update
 * @param {UpdateItemDTO} request.body.required - The updated item data
 * @returns {object} 200 - The updated item
 * @returns {object} 400 - Invalid request body
 * @returns {object} 404 - Item not found
 * @example request - example payload
 * {
 *   "name": "Updated Item Name",
 *   "quantity": 15
 * }
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "id": "123", "name": "Updated Item Name", "quantity": 15 }
 * }
 */
items.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    if (!isValidUUID(id)) {
      return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const body = await c.req.json<UpdateItemDTO>();
    if (!isValidUpdateItemDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }

    const item: ItemDTO | null = await itemService.updateItem(id, body);
    if (!item) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    return c.json(successResponse(item), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
  }
});

/**
 * DELETE /api/items/:id
 * @summary Delete an item
 * @param {string} id.path - The ID of the item to delete
 * @returns {object} 200 - Confirmation of deletion
 * @returns {object} 404 - Item not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "message": "Item 123 deleted" }
 * }
 */
items.delete('/:id', async (c: Context) => {
  const id = c.req.param('id');
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  try {
    const checkItem: ItemDTO | null = await itemService.getItemById(id);
    if (!checkItem) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    await itemService.deleteItemById(id);

    return c.json(successResponse({ message: ItemMessages.DELETE_SUCCESS(id) }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.DELETE_ERROR), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

export default items;
