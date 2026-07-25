import { Routes } from '@angular/router';
import { Tab } from './components/tabs/tabs.model';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { AddRecipeFormComponent } from './pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component';
import { RecipeDetailComponent } from './pages/recipes/recipe-detail/recipe-detail.component';
import { RecipesComponent } from './pages/recipes/recipes.component';

export const routes: Routes = [
  { path: '', redirectTo: Tab.Dashboard, pathMatch: 'full' },
  { path: Tab.Dashboard, component: DashboardComponent },
  { path: Tab.Inventory, component: InventoryComponent },
  { path: Tab.Recipes, component: RecipesComponent },
  { path: 'recipes/new', component: AddRecipeFormComponent },
  { path: 'recipes/:id', component: RecipeDetailComponent },
  { path: 'recipes/:id/edit', component: AddRecipeFormComponent },
  { path: '**', redirectTo: Tab.Dashboard },
];
