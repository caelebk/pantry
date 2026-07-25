import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Tab } from '../tabs/tabs.model';

@Component({
  selector: 'pantry-sidebar',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() darkMode = true;
  @Input() activeTab: Tab = Tab.Dashboard;
  @Output() themeToggled = new EventEmitter<void>();
  @Output() tabSelected = new EventEmitter<Tab>();

  tabs = Tab;
  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  selectTab(tab: Tab): void {
    this.tabSelected.emit(tab);
    this.mobileMenuOpen = false;
  }

  onToggleTheme(): void {
    this.themeToggled.emit();
  }

  isDashboardActive(): boolean {
    return this.activeTab === Tab.Dashboard;
  }

  isInventoryActive(): boolean {
    return this.activeTab === Tab.Inventory;
  }

  isRecipesActive(): boolean {
    return this.activeTab === Tab.Recipes;
  }
}
