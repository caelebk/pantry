import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { MealPlannerComponent } from './pages/meal-planner/meal-planner.component';
import { Tab } from './components/tabs/tabs.model';

export const routes: Routes = [
    { path: '', redirectTo: Tab.Dashboard, pathMatch: 'full' },
    { path: Tab.Dashboard, component: DashboardComponent },
    { path: Tab.Inventory, component: InventoryComponent },
    { path: Tab.Recipes, component: RecipesComponent },
    { path: Tab.MealPlanner, component: MealPlannerComponent },
    { path: '**', redirectTo: Tab.Dashboard }
];
