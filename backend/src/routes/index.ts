/**
 * Main router - combines all route modules
 */

import { Hono } from 'hono';
import categories from './categories.routes.ts';
import ingredients from './ingredients.routes.ts';
import items from './items.routes.ts';
import recipes from './recipes.routes.ts';

const api = new Hono();

// Mount route modules
api.route('/items', items);
api.route('/recipes', recipes);
api.route('/ingredients', ingredients);
api.route('/categories', categories);

// Health check endpoint
api.get('/health', (c) => {
  return c.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default api;
