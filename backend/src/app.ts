/**
 * Main application setup
 */

import { Context, Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from './middleware/cors.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { logger } from './middleware/logger.ts';
import api from './routes/index.ts';

const app = new Hono();

// Apply global security and operational middleware
app.use('*', secureHeaders());
app.use('*', cors);
app.use('*', logger);
app.use(
  '*',
  bodyLimit({
    maxSize: 1 * 1024 * 1024, // 1MB payload limit
    onError: (c) => {
      return c.json({ status: 'error', message: 'Payload size exceeds 1MB limit' }, 413);
    },
  }),
);

// Root endpoint
app.get('/', (c: Context) => {
  return c.json({
    message: 'Pantry API',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/api/health',
    },
  });
});

// Mount API routes
app.route('/api', api);

// Error handling
app.onError(errorHandler);

export default app;
