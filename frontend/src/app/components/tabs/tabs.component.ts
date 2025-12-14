import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  input,
  InputSignal,
  Output,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Tab } from './tabs.model';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './tabs.component.html',
})
export class TabsComponent {
  activeTab: InputSignal<Tab> = input<Tab>(Tab.Dashboard);
  @Output() tabSelected = new EventEmitter<Tab>();

  tabs = Tab;

  readonly isDashboardActive = computed(
    () => this.activeTab() === Tab.Dashboard
  );
  readonly isInventoryActive = computed(
    () => this.activeTab() === Tab.Inventory
  );
  readonly isRecipesActive = computed(() => this.activeTab() === Tab.Recipes);
  readonly isMealPlannerActive = computed(
    () => this.activeTab() === Tab.MealPlanner
  );

  selectTab(tab: Tab) {
    this.tabSelected.emit(tab);
  }
}
