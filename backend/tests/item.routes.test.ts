
import { assertEquals } from "@std/assert";
import { Hono } from "hono";
import items from "../src/routes/items.routes.ts";
import { itemService } from "../src/services/item.service.ts"; 
import { CreateItemDTO, ItemDTO } from "../src/models/data-models/item.model.ts";
import { HttpStatusCode } from "../src/utils/response.ts";

// Helper to create a request
function createRequest(path: string, method: string, body?: any) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Mock data
const mockItem: ItemDTO = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  label: "Test Item",
  quantity: 5,
  unitId: 1,
  locationId: 1,
  expirationDate: new Date(),
  openedDate: undefined,
  purchaseDate: new Date(),
  notes: "Test notes",
  createdAt: new Date(),
  updatedAt: new Date()
};

Deno.test("Items API - GET /api/items - success", async () => {
  // Mock service
  const originalGetAllItems = itemService.getAllItems;
  itemService.getAllItems = async () => [mockItem];

  try {
    const app = new Hono();
    app.route("/api/items", items);

    const res = await app.request(createRequest("/api/items", "GET"));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockItem.id);
  } finally {
    itemService.getAllItems = originalGetAllItems;
  }
});

Deno.test("Items API - GET /api/items/:id - success", async () => {
  const originalGetItemById = itemService.getItemById;
  itemService.getItemById = async (id) => id === mockItem.id ? mockItem : null;

  try {
    const app = new Hono();
    app.route("/api/items", items);

    const res = await app.request(createRequest(`/api/items/${mockItem.id}`, "GET"));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockItem.id);
  } finally {
    itemService.getItemById = originalGetItemById;
  }
});

Deno.test("Items API - GET /api/items/:id - not found", async () => {
    const originalGetItemById = itemService.getItemById;
    itemService.getItemById = async () => null;
  
    try {
      const app = new Hono();
      app.route("/api/items", items);
      
      const validUuid = "123e4567-e89b-12d3-a456-426614174999"; 
      const res = await app.request(createRequest(`/api/items/${validUuid}`, "GET"));
      assertEquals(res.status, HttpStatusCode.NOT_FOUND);
    } finally {
      itemService.getItemById = originalGetItemById;
    }
  });

Deno.test("Items API - POST /api/items - success", async () => {
  const originalCreateItem = itemService.createItem;
  itemService.createItem = async (_data) => mockItem;

  try {
    const app = new Hono();
    app.route("/api/items", items);

    const newItem: CreateItemDTO = {
      label: "Test Item",
      quantity: 5,
      unitId: 1,
      locationId: 1,
      expirationDate: new Date().toISOString(),
      purchaseDate: new Date().toISOString(),
      notes: "notes",
      openedDate: undefined
    };

    const res = await app.request(createRequest("/api/items", "POST", newItem));
    assertEquals(res.status, HttpStatusCode.CREATED);
    const body = await res.json();
    assertEquals(body.data.id, mockItem.id);
  } finally {
    itemService.createItem = originalCreateItem;
  }
});

Deno.test("Items API - DELETE /api/items/:id - success", async () => {
  const originalGetItemById = itemService.getItemById;
  const originalDeleteItemById = itemService.deleteItemById;
  
  itemService.getItemById = async () => mockItem;
  itemService.deleteItemById = async () => true;

  try {
    const app = new Hono();
    app.route("/api/items", items);
    
    const res = await app.request(createRequest(`/api/items/${mockItem.id}`, "DELETE"));
    assertEquals(res.status, HttpStatusCode.OK);
  } finally {
    itemService.getItemById = originalGetItemById;
    itemService.deleteItemById = originalDeleteItemById;
  }
});
