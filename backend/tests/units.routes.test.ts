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
  shortName: 'g',
  type: 'weight',
  toBaseFactor: 1,
};

Deno.test('Units API - GET /api/units - success', async () => {
  const originalGetAll = unitService.getAllUnits;
  unitService.getAllUnits = () => Promise.resolve([_mockUnit]);

  try {
    const app = new Hono();
    app.route('/api/units', units);
    const res = await app.request(createRequest('/api/units', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
  } finally {
    unitService.getAllUnits = originalGetAll;
  }
});

Deno.test('Units API - GET /api/units/:id - success', async () => {
  const originalGetById = unitService.getUnitById;
  unitService.getUnitById = () => Promise.resolve(_mockUnit);

  try {
    const app = new Hono();
    app.route('/api/units', units);
    const res = await app.request(createRequest('/api/units/1', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, 1);
  } finally {
    unitService.getUnitById = originalGetById;
  }
});

Deno.test('Units API - GET /api/units/:id - not found', async () => {
  const originalGetById = unitService.getUnitById;
  unitService.getUnitById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/units', units);
    const res = await app.request(createRequest('/api/units/999', 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    unitService.getUnitById = originalGetById;
  }
});

Deno.test('Units API - GET /api/units/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/units', units);
  const res = await app.request(createRequest('/api/units/abc', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

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

  // Invalid parameters (string instead of number)
  const res2 = await app.request(createRequest('/api/units/convert?quantity=ten', 'GET'));
  assertEquals(res2.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Units API - GET /api/units/convert - service error', async () => {
  const originalConvert = unitService.convert;
  unitService.convert = () => Promise.reject(new Error('Random Error'));

  try {
    const app = new Hono();
    app.route('/api/units', units);
    const res = await app.request(
      createRequest('/api/units/convert?quantity=10&from=1&to=2', 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    unitService.convert = originalConvert;
  }
});
