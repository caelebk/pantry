/**
 * Items API routes
 */

import { Context, Hono } from "hono";
import { CreateItemDTO, ItemDTO, UpdateItemDTO } from "../models/data-models/item.model.ts";
import { HttpResponse, HttpErrorResponse, HttpStatusMessage, HttpStatusCode } from "../models/transfer-models/http.model.ts";

import { itemService } from "../services/item.service.ts";

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
items.get("/", async (c: Context) => {
  try {
    const items: ItemDTO[] = await itemService.getAllItems();
    const response: HttpResponse = {
      status: HttpStatusMessage.OK,
      data: items,
    };
    return c.json(response, HttpStatusCode.OK);
  } catch (_error: unknown) {
    const errorResponse: HttpErrorResponse = {
      status: HttpStatusMessage.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch items",
    };
    return c.json(errorResponse, HttpStatusCode.INTERNAL_SERVER_ERROR);
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
items.get("/:id", async (c: Context) => {
  const id = c.req.param("id");
  const item: ItemDTO | null = await itemService.findById(id);
  
  if (item) {
    const response: HttpResponse = {
      status: HttpStatusMessage.OK,
      data: item,
    };
    return c.json(response, HttpStatusCode.OK);
  } else {
    const errorResponse: HttpErrorResponse = {
      status: HttpStatusMessage.NOT_FOUND,
      message: "Item not found",
    };
    return c.json(errorResponse, HttpStatusCode.NOT_FOUND);
  }
});

/**
 * GET /api/items/:label
 * @summary Get item by label
 * @param {string} label.path - The label of the item to retrieve
 * @returns {object} 200 - The item with the specified label
 * @returns {object} 404 - Item not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "label": "123" }
 * }
 */
items.get("/:label", async (c: Context) => {
  const label = c.req.param("label");
  const item: ItemDTO | null = await itemService.findByLabel(label);
  
  if (item) {
    const response: HttpResponse = {
      status: HttpStatusMessage.OK,
      data: item,
    };
    return c.json(response, HttpStatusCode.OK);
  } else {
    const errorResponse: HttpErrorResponse = {
      status: HttpStatusMessage.NOT_FOUND,
      message: "Item not found",
    };
    return c.json(errorResponse, HttpStatusCode.NOT_FOUND);
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
items.post("/", async (c: Context) => {
  try {
    const body = await c.req.json<CreateItemDTO>();
    
    // TODO: Implement create item logic
    const response: HttpResponse = {
      status: HttpStatusMessage.CREATED,
      data: body,
    };
    return c.json(response, HttpStatusCode.CREATED);
  } catch (_error: unknown) {
      const errorResponse: HttpErrorResponse = {
          status: HttpStatusMessage.BAD_REQUEST,
          message: "Invalid request body",
      };
      return c.json(errorResponse, HttpStatusCode.BAD_REQUEST);
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
items.put("/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<UpdateItemDTO>();
    
    // TODO: Implement update item logic
    const response: HttpResponse = {
        status: HttpStatusMessage.OK,
        data: { id, ...body },
    };
    return c.json(response, HttpStatusCode.OK);
  } catch (_error: unknown) {
     const errorResponse: HttpErrorResponse = {
         status: HttpStatusMessage.BAD_REQUEST,
         message: "Invalid request body",
     };
     return c.json(errorResponse, HttpStatusCode.BAD_REQUEST);
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
items.delete("/:id", (c: Context) => {
  const id = c.req.param("id");
  
  // TODO: Implement delete item logic
  const response: HttpResponse = {
    status: HttpStatusMessage.OK,
    data: { message: `Item ${id} deleted` },
  };
  return c.json(response, HttpStatusCode.OK);
});

export default items;
