import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Tab } from './tabs.model';

@Component({
  selector: 'pantry-tabs',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  activeTab = input<Tab>(Tab.Home);
  tabSelected = output<Tab>();

  tabs = Tab;

  readonly isHomeActive = computed(() => this.activeTab() === Tab.Home);
  readonly isDashboardActive = computed(() => this.isHomeActive());
  readonly isInventoryActive = computed(() => this.activeTab() === Tab.Inventory);
  readonly isRecipesActive = computed(() => this.activeTab() === Tab.Recipes);
  readonly isShoppingListActive = computed(() => this.activeTab() === Tab.ShoppingList);
  readonly isMealPlannerActive = computed(() => this.activeTab() === Tab.MealPlanner);

  selectTab(tab: Tab) {
    this.tabSelected.emit(tab);
  }
}
