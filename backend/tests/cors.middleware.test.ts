import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { cors } from '../src/middleware/cors.ts';

Deno.test('CORS Middleware - allows dynamic Origin header from custom host', async () => {
  const app = new Hono();
  app.use('*', cors);
  app.get('/api/test', (c) => c.text('ok'));

  const req = new Request('http://localhost/api/test', {
    headers: { Origin: 'http://192.168.1.100:4200' },
  });
  const res = await app.request(req);

  assertEquals(res.status, 200);
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'http://192.168.1.100:4200');
});

Deno.test('CORS Middleware - sets wildcard origin when Origin header is missing', async () => {
  const app = new Hono();
  app.use('*', cors);
  app.get('/api/test', (c) => c.text('ok'));

  const req = new Request('http://localhost/api/test');
  const res = await app.request(req);

  assertEquals(res.status, 200);
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), '*');
});

Deno.test('CORS Middleware - handles OPTIONS preflight request', async () => {
  const app = new Hono();
  app.use('*', cors);

  const req = new Request('http://localhost/api/test', {
    method: 'OPTIONS',
    headers: { Origin: 'http://my-custom-domain.com' },
  });
  const res = await app.request(req);

  assertEquals(res.status, 204);
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'http://my-custom-domain.com');
  assertEquals(
    res.headers.get('Access-Control-Allow-Methods'),
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
});
