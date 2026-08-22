/**
 * Main router - combines all route modules.
 *
 * All endpoints live under /api/v1. The legacy duplicate mounts under /api/*
 * (including the /nutrient-* and /items, /categories shims) were removed —
 * see docs/ARCHITECTURE_REVIEW_2026-08-21.md, workstream 3.
 */

import { Hono } from 'hono';
import ingredientCategories from './ingredient-categories.routes.ts';
import ingredientGroups from './ingredient-groups.routes.ts';
import ingredientItems from './ingredient-items.routes.ts';
import ingredients from './ingredients.routes.ts';
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

// Domain route modules
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

// Health check endpoint (unversioned, used by Docker/CI readiness probes)
api.get('/health', (c) => {
  return c.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default api;
