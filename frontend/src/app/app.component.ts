import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MealPlannerComponent } from './pages/meal-planner/meal-planner.component';
import { Tab } from './components/tabs/tabs.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TabsComponent, InventoryComponent, RecipesComponent, DashboardComponent, MealPlannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  Tab = Tab; // Expose enum to template
  title = 'Pantry';
  darkMode = true;
  currentTab: Tab = Tab.Dashboard;

  toggleTheme() {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  ngOnInit() {
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }

  onTabSelected(tab: Tab) {
    this.currentTab = tab;
  }
}
