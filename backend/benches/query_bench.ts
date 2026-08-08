import { getDB, initDB } from '../src/db/client.ts';
import { recipeService } from '../src/services/recipe.service.ts';
import { ingredientItemService } from '../src/services/ingredient-item.service.ts';

// Setup DB connection for benchmarking
initDB();
const db = getDB();

Deno.bench('DB Query - Fetch all recipe ingredients', () => {
  db.prepare('SELECT * FROM recipe_ingredients ORDER BY ingredient_order ASC').all();
});

Deno.bench('DB Query - Fetch all ingredient items with units', () => {
  db.prepare(`
    SELECT i.*, u.name as unit_name
    FROM ingredient_items i
    LEFT JOIN units u ON i.unit_id = u.id
  `).all();
});

Deno.bench('Service Method - RecipeService.findAll()', async () => {
  await recipeService.findAll();
});

Deno.bench('Service Method - RecipeService.getAvailableRecipes()', async () => {
  await recipeService.getAvailableRecipes();
});

Deno.bench('Service Method - IngredientItemService.getAllIngredientItems()', async () => {
  await ingredientItemService.getAllIngredientItems();
});
