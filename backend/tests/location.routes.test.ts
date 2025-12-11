import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { LocationDTO } from '../src/models/data-models/location.model.ts';
import locations from '../src/routes/locations.routes.ts';
import { locationService } from '../src/services/location.service.ts';
import { HttpStatusCode } from '../src/utils/response.ts';

function createRequest(path: string, method: string) {
  return new Request(`http://localhost${path}`, { method });
}

const mockLocation: LocationDTO = {
  id: 1,
  name: 'Pantry',
};

Deno.test('Locations API - GET /api/locations - success', async () => {
  const originalGetAll = locationService.getAllLocations;
  locationService.getAllLocations = () => Promise.resolve([mockLocation]);

  try {
    const app = new Hono();
    app.route('/api/locations', locations);

    const res = await app.request(createRequest('/api/locations', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
  } finally {
    locationService.getAllLocations = originalGetAll;
  }
});

Deno.test('Locations API - GET /api/locations - service error', async () => {
  const originalGetAll = locationService.getAllLocations;
  locationService.getAllLocations = () => Promise.reject(new Error('Fail'));

  try {
    const app = new Hono();
    app.route('/api/locations', locations);
    const res = await app.request(createRequest('/api/locations', 'GET'));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    locationService.getAllLocations = originalGetAll;
  }
});

Deno.test('Locations API - GET /api/locations/:id - success', async () => {
  const originalGetById = locationService.getLocationById;
  locationService.getLocationById = () => Promise.resolve(mockLocation);

  try {
    const app = new Hono();
    app.route('/api/locations', locations);
    const res = await app.request(createRequest('/api/locations/1', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, 1);
  } finally {
    locationService.getLocationById = originalGetById;
  }
});

Deno.test('Locations API - GET /api/locations/:id - not found', async () => {
  const originalGetById = locationService.getLocationById;
  locationService.getLocationById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/locations', locations);
    const res = await app.request(createRequest('/api/locations/999', 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    locationService.getLocationById = originalGetById;
  }
});

Deno.test('Locations API - GET /api/locations/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/locations', locations);
  const res = await app.request(createRequest('/api/locations/abc', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});
