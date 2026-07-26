/**
 * Main router - combines all route modules
 */

import { Hono } from 'hono';
import categories from './categories.routes.ts';
import ingredientGroups from './ingredient-groups.routes.ts';
import ingredientItems from './ingredient-items.routes.ts';
import ingredients from './ingredients.routes.ts';
import items from './items.routes.ts';
import locations from './locations.routes.ts';
import mealPlans from './meal-plans.routes.ts';
import nutrientGroups from './nutrient-groups.routes.ts';
import nutrientTypes from './nutrient-types.routes.ts';
import recipes from './recipes.routes.ts';
import shoppingList from './shopping-list.routes.ts';
import units from './units.routes.ts';

const api = new Hono();

// Mount primary domain route modules
api.route('/nutrient-groups', nutrientGroups);
api.route('/ingredient-groups', ingredientGroups);
api.route('/ingredients', ingredients);
api.route('/ingredient-items', ingredientItems);

// Mount legacy alias endpoints for backwards compatibility
api.route('/items', items);
api.route('/categories', categories);
api.route('/nutrient-types', nutrientTypes);

// Other system route modules
api.route('/recipes', recipes);
api.route('/units', units);
api.route('/locations', locations);
api.route('/meal-plans', mealPlans);
api.route('/shopping-list', shoppingList);

// Health check endpoint
api.get('/health', (c) => {
  return c.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default api;
