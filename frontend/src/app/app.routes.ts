import { Routes } from '@angular/router';
import { Tab } from './components/tabs/tabs.model';
import { HomeComponent } from './pages/home/home.component';
import { AddIngredientGroupPageComponent } from './pages/inventory/add-ingredient-group-page/add-ingredient-group-page.component';
import { AddIngredientPageComponent } from './pages/inventory/add-ingredient-page/add-ingredient-page.component';
import { AddItemPageComponent } from './pages/inventory/add-item-page/add-item-page.component';
import { EditIngredientGroupPageComponent } from './pages/inventory/edit-ingredient-group-page/edit-ingredient-group-page.component';
import { EditIngredientPageComponent } from './pages/inventory/edit-ingredient-page/edit-ingredient-page.component';
import { EditItemPageComponent } from './pages/inventory/edit-item-page/edit-item-page.component';
import { IngredientGroupsPageComponent } from './pages/inventory/ingredient-groups-page/ingredient-groups-page.component';
import { IngredientsPageComponent } from './pages/inventory/ingredients-page/ingredients-page.component';
import { InventoryOverviewPageComponent } from './pages/inventory/inventory-overview-page/inventory-overview-page.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { MealPlannerComponent } from './pages/meal-planner/meal-planner.component';
import { PlanMealPageComponent } from './pages/meal-planner/plan-meal-page/plan-meal-page.component';
import { AddRecipeFormComponent } from './pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component';
import { RecipeDetailComponent } from './pages/recipes/recipe-detail/recipe-detail.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { AddShoppingItemPageComponent } from './pages/shopping-list/add-item-page/add-item-page.component';
import { RestockReviewPageComponent } from './pages/shopping-list/restock-review-page/restock-review-page.component';
import { ShoppingListComponent } from './pages/shopping-list/shopping-list.component';

export const routes: Routes = [
  { path: '', redirectTo: Tab.Home, pathMatch: 'full' },
  { path: Tab.Home, component: HomeComponent },
  { path: 'dashboard', redirectTo: Tab.Home, pathMatch: 'full' },

  // Inventory Sub-Routes & Dedicated Pages
  { path: 'inventory', component: InventoryOverviewPageComponent },
  { path: 'inventory/items', component: InventoryComponent },
  { path: 'inventory/items/new', component: AddItemPageComponent },
  { path: 'inventory/items/:id/edit', component: EditItemPageComponent },
  { path: 'inventory/new', redirectTo: 'inventory/items/new', pathMatch: 'full' },
  { path: 'inventory/:id/edit', redirectTo: 'inventory/items/:id/edit', pathMatch: 'full' },

  { path: 'inventory/ingredients', component: IngredientsPageComponent },
  { path: 'inventory/ingredients/new', component: AddIngredientPageComponent },
  { path: 'inventory/ingredients/:id/edit', component: EditIngredientPageComponent },

  { path: 'inventory/groups', component: IngredientGroupsPageComponent },
  { path: 'inventory/groups/new', component: AddIngredientGroupPageComponent },
  { path: 'inventory/groups/:id/edit', component: EditIngredientGroupPageComponent },

  { path: 'inventory/nutrients', redirectTo: 'inventory/groups', pathMatch: 'full' },

  // Recipes Routes
  { path: Tab.Recipes, component: RecipesComponent },
  { path: 'recipes/new', component: AddRecipeFormComponent },
  { path: 'recipes/:id', component: RecipeDetailComponent },
  { path: 'recipes/:id/edit', component: AddRecipeFormComponent },

  // Shopping List Routes
  { path: Tab.ShoppingList, component: ShoppingListComponent },
  { path: 'shopping-list/new', component: AddShoppingItemPageComponent },
  { path: 'shopping-list/add', redirectTo: 'shopping-list/new', pathMatch: 'full' },
  { path: 'shopping-list/restock', component: RestockReviewPageComponent },

  // Meal Planner Routes
  { path: Tab.MealPlanner, component: MealPlannerComponent },
  { path: 'meal-planner/new', component: PlanMealPageComponent },
  { path: 'meal-planner/add', redirectTo: 'meal-planner/new', pathMatch: 'full' },

  { path: '**', redirectTo: Tab.Home },
];
