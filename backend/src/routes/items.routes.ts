/**
 * Items API routes
 */

import { Hono } from "hono";
import type { CreateItemDTO, UpdateItemDTO } from "../models/item.model.ts";

const items = new Hono();

// GET /api/items - Get all items
items.get("/", (c) => {
  // TODO: Implement get all items logic
  return c.json({
    status: "success",
    data: [],
  });
});

// GET /api/items/:id - Get item by ID
items.get("/:id", (c) => {
  const id = c.req.param("id");
  
  // TODO: Implement get item by ID logic
  return c.json({
    status: "success",
    data: { id },
  });
});

// POST /api/items - Create new item
items.post("/", async (c) => {
  const body: CreateItemDTO = await c.req.json();
  
  // TODO: Implement create item logic
  return c.json(
    {
      status: "success",
      data: body,
    },
    201
  );
});

// PUT /api/items/:id - Update item
items.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body: UpdateItemDTO = await c.req.json();
  
  // TODO: Implement update item logic
  return c.json({
    status: "success",
    data: { id, ...body },
  });
});

// DELETE /api/items/:id - Delete item
items.delete("/:id", (c) => {
  const id = c.req.param("id");
  
  // TODO: Implement delete item logic
  return c.json({
    status: "success",
    message: `Item ${id} deleted`,
  });
});

export default items;
