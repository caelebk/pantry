import { Routes } from '@angular/router';
import { Tab } from './components/tabs/tabs.model';

export const routes: Routes = [
  { path: '', redirectTo: Tab.Home, pathMatch: 'full' },
  {
    path: Tab.Home,
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  { path: 'dashboard', redirectTo: Tab.Home, pathMatch: 'full' },

  // Inventory Sub-Routes & Dedicated Pages
  {
    path: 'inventory',
    loadComponent: () =>
      import('./pages/inventory/inventory-overview-page/inventory-overview-page.component').then(
        (m) => m.InventoryOverviewPageComponent,
      ),
  },
  {
    path: 'inventory/items',
    loadComponent: () =>
      import('./pages/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'inventory/items/new',
    loadComponent: () =>
      import('./pages/inventory/add-item-page/add-item-page.component').then(
        (m) => m.AddItemPageComponent,
      ),
  },
  {
    path: 'inventory/items/:id/edit',
    loadComponent: () =>
      import('./pages/inventory/edit-item-page/edit-item-page.component').then(
        (m) => m.EditItemPageComponent,
      ),
  },
  { path: 'inventory/new', redirectTo: 'inventory/items/new', pathMatch: 'full' },
  { path: 'inventory/:id/edit', redirectTo: 'inventory/items/:id/edit', pathMatch: 'full' },

  {
    path: 'inventory/ingredients',
    loadComponent: () =>
      import('./pages/inventory/ingredients-page/ingredients-page.component').then(
        (m) => m.IngredientsPageComponent,
      ),
  },
  {
    path: 'inventory/ingredients/new',
    loadComponent: () =>
      import('./pages/inventory/add-ingredient-page/add-ingredient-page.component').then(
        (m) => m.AddIngredientPageComponent,
      ),
  },
  {
    path: 'inventory/ingredients/:id/edit',
    loadComponent: () =>
      import('./pages/inventory/edit-ingredient-page/edit-ingredient-page.component').then(
        (m) => m.EditIngredientPageComponent,
      ),
  },
  {
    path: 'inventory/ingredients/:id/unit-reconciliation',
    loadComponent: () =>
      import('./pages/inventory/unit-reconciliation-page/unit-reconciliation-page.component').then(
        (m) => m.UnitReconciliationPageComponent,
      ),
  },

  {
    path: 'inventory/groups',
    loadComponent: () =>
      import('./pages/inventory/ingredient-groups-page/ingredient-groups-page.component').then(
        (m) => m.IngredientGroupsPageComponent,
      ),
  },
  {
    path: 'inventory/groups/new',
    loadComponent: () =>
      import('./pages/inventory/add-ingredient-group-page/add-ingredient-group-page.component').then(
        (m) => m.AddIngredientGroupPageComponent,
      ),
  },
  {
    path: 'inventory/groups/:id/edit',
    loadComponent: () =>
      import('./pages/inventory/edit-ingredient-group-page/edit-ingredient-group-page.component').then(
        (m) => m.EditIngredientGroupPageComponent,
      ),
  },

  { path: 'inventory/nutrients', redirectTo: 'inventory/groups', pathMatch: 'full' },

  // Recipes Routes
  {
    path: Tab.Recipes,
    loadComponent: () =>
      import('./pages/recipes/recipes.component').then((m) => m.RecipesComponent),
  },
  {
    path: 'recipes/new',
    loadComponent: () =>
      import('./pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component').then(
        (m) => m.AddRecipeFormComponent,
      ),
  },
  {
    path: 'recipes/:id',
    loadComponent: () =>
      import('./pages/recipes/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () =>
      import('./pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component').then(
        (m) => m.AddRecipeFormComponent,
      ),
  },

  // Shopping List Routes
  {
    path: Tab.ShoppingList,
    loadComponent: () =>
      import('./pages/shopping-list/shopping-list.component').then((m) => m.ShoppingListComponent),
  },
  {
    path: 'shopping-list/new',
    loadComponent: () =>
      import('./pages/shopping-list/add-item-page/add-item-page.component').then(
        (m) => m.AddShoppingItemPageComponent,
      ),
  },
  { path: 'shopping-list/add', redirectTo: 'shopping-list/new', pathMatch: 'full' },
  {
    path: 'shopping-list/restock',
    loadComponent: () =>
      import('./pages/shopping-list/restock-review-page/restock-review-page.component').then(
        (m) => m.RestockReviewPageComponent,
      ),
  },

  // Meal Planner Routes
  {
    path: Tab.MealPlanner,
    loadComponent: () =>
      import('./pages/meal-planner/meal-planner.component').then((m) => m.MealPlannerComponent),
  },
  {
    path: 'meal-planner/new',
    loadComponent: () =>
      import('./pages/meal-planner/plan-meal-page/plan-meal-page.component').then(
        (m) => m.PlanMealPageComponent,
      ),
  },
  { path: 'meal-planner/add', redirectTo: 'meal-planner/new', pathMatch: 'full' },

  { path: '**', redirectTo: Tab.Home },
];
