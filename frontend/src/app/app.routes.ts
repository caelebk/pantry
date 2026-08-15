import { Routes } from '@angular/router';
import { Tab } from './components/tabs/tabs.model';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Guest Routes (Only accessible when NOT logged in)
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    data: { animation: 'LoginPage' },
    loadComponent: () => import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/signup',
    canActivate: [guestGuard],
    data: { animation: 'SignupPage' },
    loadComponent: () =>
      import('./pages/auth/signup/signup.component').then((m) => m.SignupComponent),
  },

  // Protected App Routes (Require authentication via authGuard)
  {
    path: 'profile',
    canActivate: [authGuard],
    data: { animation: 'ProfilePage' },
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: '', redirectTo: Tab.Home, pathMatch: 'full' },
  {
    path: Tab.Home,
    canActivate: [authGuard],
    data: { animation: 'HomePage' },
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  { path: 'dashboard', redirectTo: Tab.Home, pathMatch: 'full' },

  // Inventory Sub-Routes & Dedicated Pages (Protected)
  {
    path: 'inventory',
    canActivate: [authGuard],
    data: { animation: 'InventoryOverviewPage' },
    loadComponent: () =>
      import('./pages/inventory/inventory-overview-page/inventory-overview-page.component').then(
        (m) => m.InventoryOverviewPageComponent,
      ),
  },
  {
    path: 'inventory/items',
    canActivate: [authGuard],
    data: { animation: 'InventoryItemsPage' },
    loadComponent: () =>
      import('./pages/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'inventory/items/new',
    canActivate: [authGuard],
    data: { animation: 'AddItemPage' },
    loadComponent: () =>
      import('./pages/inventory/add-item-page/add-item-page.component').then(
        (m) => m.AddItemPageComponent,
      ),
  },
  {
    path: 'inventory/items/:id/edit',
    canActivate: [authGuard],
    data: { animation: 'EditItemPage' },
    loadComponent: () =>
      import('./pages/inventory/edit-item-page/edit-item-page.component').then(
        (m) => m.EditItemPageComponent,
      ),
  },
  { path: 'inventory/new', redirectTo: 'inventory/items/new', pathMatch: 'full' },
  { path: 'inventory/:id/edit', redirectTo: 'inventory/items/:id/edit', pathMatch: 'full' },

  {
    path: 'inventory/ingredients',
    canActivate: [authGuard],
    data: { animation: 'IngredientsPage' },
    loadComponent: () =>
      import('./pages/inventory/ingredients-page/ingredients-page.component').then(
        (m) => m.IngredientsPageComponent,
      ),
  },
  {
    path: 'inventory/ingredients/new',
    canActivate: [authGuard],
    data: { animation: 'AddIngredientPage' },
    loadComponent: () =>
      import('./pages/inventory/add-ingredient-page/add-ingredient-page.component').then(
        (m) => m.AddIngredientPageComponent,
      ),
  },
  {
    path: 'inventory/ingredients/:id/edit',
    canActivate: [authGuard],
    data: { animation: 'EditIngredientPage' },
    loadComponent: () =>
      import('./pages/inventory/edit-ingredient-page/edit-ingredient-page.component').then(
        (m) => m.EditIngredientPageComponent,
      ),
  },
  {
    path: 'inventory/ingredients/:id/unit-reconciliation',
    canActivate: [authGuard],
    data: { animation: 'UnitReconciliationPage' },
    loadComponent: () =>
      import('./pages/inventory/unit-reconciliation-page/unit-reconciliation-page.component').then(
        (m) => m.UnitReconciliationPageComponent,
      ),
  },

  {
    path: 'inventory/groups',
    canActivate: [authGuard],
    data: { animation: 'IngredientGroupsPage' },
    loadComponent: () =>
      import('./pages/inventory/ingredient-groups-page/ingredient-groups-page.component').then(
        (m) => m.IngredientGroupsPageComponent,
      ),
  },
  {
    path: 'inventory/groups/new',
    canActivate: [authGuard],
    data: { animation: 'AddIngredientGroupPage' },
    loadComponent: () =>
      import('./pages/inventory/add-ingredient-group-page/add-ingredient-group-page.component').then(
        (m) => m.AddIngredientGroupPageComponent,
      ),
  },
  {
    path: 'inventory/groups/:id/edit',
    canActivate: [authGuard],
    data: { animation: 'EditIngredientGroupPage' },
    loadComponent: () =>
      import('./pages/inventory/edit-ingredient-group-page/edit-ingredient-group-page.component').then(
        (m) => m.EditIngredientGroupPageComponent,
      ),
  },

  { path: 'inventory/nutrients', redirectTo: 'inventory/groups', pathMatch: 'full' },

  // Recipes Routes (Protected)
  {
    path: Tab.Recipes,
    canActivate: [authGuard],
    data: { animation: 'RecipesPage' },
    loadComponent: () =>
      import('./pages/recipes/recipes.component').then((m) => m.RecipesComponent),
  },
  {
    path: 'recipes/new',
    canActivate: [authGuard],
    data: { animation: 'AddRecipePage' },
    loadComponent: () =>
      import('./pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component').then(
        (m) => m.AddRecipeFormComponent,
      ),
  },
  {
    path: 'recipes/:id',
    canActivate: [authGuard],
    data: { animation: 'RecipeDetailPage' },
    loadComponent: () =>
      import('./pages/recipes/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  {
    path: 'recipes/:id/edit',
    canActivate: [authGuard],
    data: { animation: 'EditRecipePage' },
    loadComponent: () =>
      import('./pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component').then(
        (m) => m.AddRecipeFormComponent,
      ),
  },

  // Shopping List Routes (Protected)
  {
    path: Tab.ShoppingList,
    canActivate: [authGuard],
    data: { animation: 'ShoppingListPage' },
    loadComponent: () =>
      import('./pages/shopping-list/shopping-list.component').then((m) => m.ShoppingListComponent),
  },
  {
    path: 'shopping-list/new',
    canActivate: [authGuard],
    data: { animation: 'AddShoppingItemPage' },
    loadComponent: () =>
      import('./pages/shopping-list/add-item-page/add-item-page.component').then(
        (m) => m.AddShoppingItemPageComponent,
      ),
  },
  {
    path: 'shopping-list/stores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shopping-list/stores-page/stores-page.component').then(
        (m) => m.StoresPageComponent,
      ),
  },
  {
    path: 'shopping-list/:id/edit',
    canActivate: [authGuard],
    data: { animation: 'EditShoppingItemPage' },
    loadComponent: () =>
      import('./pages/shopping-list/add-item-page/add-item-page.component').then(
        (m) => m.AddShoppingItemPageComponent,
      ),
  },
  { path: 'shopping-list/add', redirectTo: 'shopping-list/new', pathMatch: 'full' },
  {
    path: 'shopping-list/restock',
    canActivate: [authGuard],
    data: { animation: 'RestockReviewPage' },
    loadComponent: () =>
      import('./pages/shopping-list/restock-review-page/restock-review-page.component').then(
        (m) => m.RestockReviewPageComponent,
      ),
  },

  // Meal Planner Routes (Protected)
  {
    path: Tab.MealPlanner,
    canActivate: [authGuard],
    data: { animation: 'MealPlannerPage' },
    loadComponent: () =>
      import('./pages/meal-planner/meal-planner.component').then((m) => m.MealPlannerComponent),
  },
  {
    path: 'meal-planner/new',
    canActivate: [authGuard],
    data: { animation: 'PlanMealPage' },
    loadComponent: () =>
      import('./pages/meal-planner/plan-meal-page/plan-meal-page.component').then(
        (m) => m.PlanMealPageComponent,
      ),
  },
  { path: 'meal-planner/add', redirectTo: 'meal-planner/new', pathMatch: 'full' },

  { path: '**', redirectTo: Tab.Home },
];
