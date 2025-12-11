import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { UnitDTO } from '../src/models/data-models/unit.model.ts';
import units from '../src/routes/units.routes.ts';
import { unitService } from '../src/services/units.service.ts';
import { HttpStatusCode } from '../src/utils/response.ts';

// Helper
function createRequest(path: string, method: string) {
  return new Request(`http://localhost${path}`, { method });
}

const _mockUnit: UnitDTO = {
  id: 1,
  name: 'Gram',
  type: 'weight',
  toBaseFactor: 1,
};

Deno.test('Units API - GET /api/units/convert - success', async () => {
  const originalConvert = unitService.convert;
  unitService.convert = () => Promise.resolve(500);

  try {
    const app = new Hono();
    app.route('/api/units', units);

    const res = await app.request(
      createRequest('/api/units/convert?quantity=10&from=1&to=2', 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.quantity, 500);
  } finally {
    unitService.convert = originalConvert;
  }
});

Deno.test('Units API - GET /api/units/convert - invalid failure', async () => {
  const app = new Hono();
  app.route('/api/units', units);

  // Missing parameters
  const res = await app.request(createRequest('/api/units/convert?quantity=10', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});
