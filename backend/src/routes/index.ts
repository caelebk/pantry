/**
 * Main router - combines all route modules
 */

import { Hono } from 'hono';
import categories from './categories.routes.ts';
import ingredientCategories from './ingredient-categories.routes.ts';
import ingredientGroups from './ingredient-groups.routes.ts';
import ingredientItems from './ingredient-items.routes.ts';
import ingredients from './ingredients.routes.ts';
import items from './items.routes.ts';
import locations from './locations.routes.ts';
import mealPlans from './meal-plans.routes.ts';
import recipes from './recipes.routes.ts';
import shoppingList from './shopping-list.routes.ts';
import stores from './stores.routes.ts';
import units from './units.routes.ts';
import { authRoutes } from './auth.routes.ts';
import { kitchenRoutes } from './kitchen.routes.ts';

const api = new Hono();
const v1 = new Hono();

// Auth & Kitchen routes
v1.route('/auth', authRoutes);
v1.route('/kitchens', kitchenRoutes);
v1.route('/', authRoutes); // Exposes /me/profile, /me/password, /me/sessions under /v1/me/*

// Primary domain route modules under /v1
v1.route('/ingredient-categories', ingredientCategories);
v1.route('/ingredient-groups', ingredientGroups);
v1.route('/ingredients', ingredients);
v1.route('/ingredient-items', ingredientItems);
v1.route('/recipes', recipes);
v1.route('/units', units);
v1.route('/locations', locations);
v1.route('/meal-plans', mealPlans);
v1.route('/shopping-list', shoppingList);
v1.route('/stores', stores);

// Mount /v1 sub-router onto /api/v1
api.route('/v1', v1);

// Also mount directly under /api for backwards compatibility
api.route('/auth', authRoutes);
api.route('/kitchens', kitchenRoutes);
api.route('/', authRoutes);

api.route('/ingredient-categories', ingredientCategories);
api.route('/ingredient-groups', ingredientGroups);
api.route('/ingredients', ingredients);
api.route('/ingredient-items', ingredientItems);

// Mount legacy alias endpoints
api.route('/nutrient-groups', ingredientCategories);
api.route('/nutrient-types', ingredientCategories);
api.route('/items', items);
api.route('/categories', categories);
api.route('/recipes', recipes);
api.route('/units', units);
api.route('/locations', locations);
api.route('/meal-plans', mealPlans);
api.route('/shopping-list', shoppingList);
api.route('/stores', stores);

// Health check endpoint
api.get('/health', (c) => {
  return c.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default api;
