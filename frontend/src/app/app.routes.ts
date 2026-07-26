import { Routes } from '@angular/router';
import { Tab } from './components/tabs/tabs.model';
import { HomeComponent } from './pages/home/home.component';
import { AddItemPageComponent } from './pages/inventory/add-item-page/add-item-page.component';
import { EditItemPageComponent } from './pages/inventory/edit-item-page/edit-item-page.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { MealPlannerComponent } from './pages/meal-planner/meal-planner.component';
import { AddRecipeFormComponent } from './pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component';
import { RecipeDetailComponent } from './pages/recipes/recipe-detail/recipe-detail.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { ShoppingListComponent } from './pages/shopping-list/shopping-list.component';

export const routes: Routes = [
  { path: '', redirectTo: Tab.Home, pathMatch: 'full' },
  { path: Tab.Home, component: HomeComponent },
  { path: 'dashboard', redirectTo: Tab.Home, pathMatch: 'full' },
  { path: Tab.Inventory, component: InventoryComponent },
  { path: 'inventory/new', component: AddItemPageComponent },
  { path: 'inventory/:id/edit', component: EditItemPageComponent },
  { path: Tab.Recipes, component: RecipesComponent },
  { path: 'recipes/new', component: AddRecipeFormComponent },
  { path: 'recipes/:id', component: RecipeDetailComponent },
  { path: 'recipes/:id/edit', component: AddRecipeFormComponent },
  { path: Tab.ShoppingList, component: ShoppingListComponent },
  { path: Tab.MealPlanner, component: MealPlannerComponent },
  { path: '**', redirectTo: Tab.Home },
];

