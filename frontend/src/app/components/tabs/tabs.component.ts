import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, InputSignal, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Tab } from './tabs.model';

@Component({
  selector: 'pantry-tabs',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './tabs.component.html',
})
export class TabsComponent {
  activeTab: InputSignal<Tab> = input<Tab>(Tab.Home);
  @Output() tabSelected = new EventEmitter<Tab>();

  tabs = Tab;

  readonly isHomeActive = computed(() => this.activeTab() === Tab.Home);
  readonly isDashboardActive = computed(() => this.isHomeActive());
  readonly isInventoryActive = computed(() => this.activeTab() === Tab.Inventory);
  readonly isRecipesActive = computed(() => this.activeTab() === Tab.Recipes);

  selectTab(tab: Tab) {
    this.tabSelected.emit(tab);
  }
}
