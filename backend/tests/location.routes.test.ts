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
