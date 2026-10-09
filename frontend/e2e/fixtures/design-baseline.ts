import type { Page } from '@playwright/test';
import type { UserProfileResponse } from '../../src/app/core/models/auth.model';
import type { IngredientCategory } from '../../src/app/models/ingredient-category.model';
import type { IngredientGroup } from '../../src/app/models/ingredient-group.model';
import type { IngredientDTO } from '../../src/app/models/ingredient.model';
import type { IngredientItemDTO } from '../../src/app/models/items.model';
import type { LocationDTO } from '../../src/app/models/location.model';
import type { PlannedMeal } from '../../src/app/models/meal-planner.model';
import type { Recipe } from '../../src/app/models/recipe.model';
import type { ShoppingItem } from '../../src/app/models/shopping-list.model';
import type { Store } from '../../src/app/models/store.model';
import type { UnitDTO } from '../../src/app/models/unit.model';

export type BaselineTheme = 'light' | 'dark';
export const fixtureVersion = 'synthetic-kitchen-v1';
export const fixtureNow = '2026-10-03T12:00:00.000Z';
export const kitchenName = 'Weekend Kitchen';
export const longIngredientName = 'Organic whole grain brown basmati rice';

const units: UnitDTO[] = [
  { id: 1, name: 'Gram', shortName: 'g', type: 'Weight', toBaseFactor: 1 },
  { id: 2, name: 'Piece', shortName: 'pc', type: 'Count', toBaseFactor: 1 },
];
const locations: LocationDTO[] = [
  { id: 1, name: 'Pantry' },
  { id: 2, name: 'Fridge' },
  { id: 3, name: 'Freezer' },
];
const categories: IngredientCategory[] = [
  { id: 1, name: 'Produce', icon: 'pi pi-leaf', color: '#10b981' },
  { id: 2, name: 'Grains', icon: 'pi pi-box', color: '#f59e0b' },
];
const groups: IngredientGroup[] = [
  { id: 1, name: 'Vegetables', ingredientCategoryId: 1, ingredientCategoryName: 'Produce' },
  { id: 2, name: 'Rice', ingredientCategoryId: 2, ingredientCategoryName: 'Grains' },
];
const ingredients: IngredientDTO[] = [
  { id: 'ingredient-spinach', name: 'Baby spinach', ingredientGroupId: 1, defaultUnitId: 1 },
  { id: 'ingredient-tomato', name: 'Cherry tomatoes', ingredientGroupId: 1, defaultUnitId: 1 },
  { id: 'ingredient-rice', name: longIngredientName, ingredientGroupId: 2, defaultUnitId: 1 },
];
const items: IngredientItemDTO[] = [
  {
    id: 'item-spinach',
    ingredientId: 'ingredient-spinach',
    label: 'Baby spinach',
    quantity: 200,
    unitId: 1,
    locationId: 2,
    purchaseDate: '2026-09-28',
    expirationDate: '2026-10-02',
    notes: 'Synthetic expired stock for visual review.',
  },
  {
    id: 'item-tomato',
    ingredientId: 'ingredient-tomato',
    label: 'Cherry tomatoes',
    quantity: 450,
    unitId: 1,
    locationId: 2,
    purchaseDate: '2026-10-01',
    expirationDate: '2026-10-06',
    notes: 'Synthetic stock expiring soon.',
  },
  {
    id: 'item-rice',
    ingredientId: 'ingredient-rice',
    label: longIngredientName,
    quantity: 1250,
    unitId: 1,
    locationId: 1,
    purchaseDate: '2026-09-15',
    expirationDate: '2027-03-15',
    notes: 'Long label for wrapping and hierarchy review.',
  },
];
const recipes: Recipe[] = [
  {
    id: 'recipe-rice',
    name: 'Tomato and brown rice bowl',
    description: 'A simple weekday bowl with warm rice and fresh tomatoes.',
    difficultyId: 1,
    difficulty: 'Easy',
    servings: 2,
    prepTime: 10,
    cookTime: 25,
    ingredients: [
      { ingredientId: 'ingredient-rice', quantity: 200, unitId: 1 },
      { ingredientId: 'ingredient-tomato', quantity: 200, unitId: 1 },
    ],
    steps: [{ stepNumber: 1, instructionText: 'Cook the rice and serve with tomatoes.' }],
  },
  {
    id: 'recipe-spinach',
    name: 'Spinach and roasted cherry tomato salad',
    description: 'A longer recipe title to exercise card wrapping.',
    difficultyId: 1,
    difficulty: 'Easy',
    servings: 2,
    prepTime: 15,
    cookTime: 10,
    ingredients: [{ ingredientId: 'ingredient-spinach', quantity: 100, unitId: 1 }],
    steps: [{ stepNumber: 1, instructionText: 'Roast tomatoes and toss with spinach.' }],
  },
];
const shopping: ShoppingItem[] = [
  {
    id: 'shopping-spinach',
    name: 'Baby spinach',
    ingredientId: 'ingredient-spinach',
    category: 'Produce',
    quantity: 200,
    unit: 'g',
    checked: false,
    estimatedPrice: 3.5,
    storeName: 'Neighbourhood Market',
    source: 'manual',
  },
  {
    id: 'shopping-rice',
    name: longIngredientName,
    ingredientId: 'ingredient-rice',
    category: 'Grains',
    quantity: 1000,
    unit: 'g',
    checked: false,
    estimatedPrice: 7.25,
    storeName: 'Neighbourhood Market',
    source: 'manual',
  },
  {
    id: 'shopping-tomato',
    name: 'Cherry tomatoes',
    ingredientId: 'ingredient-tomato',
    category: 'Produce',
    quantity: 450,
    unit: 'g',
    checked: true,
    estimatedPrice: 4.2,
    source: 'manual',
  },
];
const stores: Store[] = [{ id: 'store-market', name: 'Neighbourhood Market', archived: false }];
const meals: PlannedMeal[] = [];

/** Every API call is intercepted; unknown routes or mutations never reach a real kitchen. */
export async function installDesignBaseline(
  page: Page,
  theme: BaselineTheme,
  options: { kitchenName?: string } = {},
) {
  const unexpectedRequests: string[] = [];
  const servedRequests: string[] = [];
  const profile: UserProfileResponse = {
    user: {
      id: 'design-user',
      email: 'design-review@example.invalid',
      fullName: 'Alex Sample',
      globalRole: 'user',
      themePreference: theme,
      locale: 'en',
      primaryKitchenId: 'design-kitchen',
    },
    memberships: [
      {
        id: 'design-kitchen',
        name: options.kitchenName ?? kitchenName,
        role: 'owner',
        memberCount: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
  };
  const responses: Record<string, unknown> = {
    'POST /api/v1/auth/refresh': { accessToken: 'synthetic-design-token', expiresIn: 3600 },
    'GET /api/v1/me/profile': profile,
    'GET /api/v1/units': units,
    'GET /api/v1/locations': locations,
    'GET /api/v1/ingredient-categories': categories,
    'GET /api/v1/ingredient-groups': groups,
    'GET /api/v1/ingredients': ingredients,
    'GET /api/v1/ingredient-items': items,
    'GET /api/v1/recipes': recipes,
    'GET /api/v1/recipes/available': [recipes[0]],
    'GET /api/v1/shopping-list': shopping,
    'GET /api/v1/stores': stores,
    'GET /api/v1/meal-plans': meals,
  };
  await page.clock.setFixedTime(new Date(fixtureNow));
  await page.addInitScript(() => localStorage.removeItem('activeKitchenId'));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const key = `${request.method()} ${new URL(request.url()).pathname}`;
    if (!Object.prototype.hasOwnProperty.call(responses, key)) {
      unexpectedRequests.push(key);
      await route.fulfill({
        status: 501,
        json: { status: 'error', message: `Unmocked design fixture: ${key}` },
      });
      return;
    }
    servedRequests.push(key);
    await route.fulfill({ json: { status: 'success', data: responses[key] } });
  });
  return { unexpectedRequests, servedRequests };
}
