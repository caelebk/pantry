import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MealPlannerComponent } from './pages/meal-planner/meal-planner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TabsComponent, InventoryComponent, RecipesComponent, DashboardComponent, MealPlannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Pantry';
  darkMode = false;
  currentTab = 'dashboard';

  toggleTheme() {
    this.darkMode = !this.darkMode;
  }

  onTabSelected(tab: string) {
    this.currentTab = tab;
  }
}
