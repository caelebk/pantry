import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Tab } from '../tabs/tabs.model';

@Component({
  selector: 'pantry-sidebar',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly router = inject(Router);

  @Input() darkMode = true;
  @Input() activeTab: Tab = Tab.Home;
  @Output() themeToggled = new EventEmitter<void>();
  @Output() tabSelected = new EventEmitter<Tab>();

  tabs = Tab;
  mobileMenuOpen = false;
  isCollapsed = false;
  inventoryExpanded = true;

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleInventoryExpanded(event?: Event): void {
    if (event) event.stopPropagation();
    this.inventoryExpanded = !this.inventoryExpanded;
  }

  selectTab(tab: Tab): void {
    this.tabSelected.emit(tab);
    this.mobileMenuOpen = false;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.mobileMenuOpen = false;
  }

  onToggleTheme(): void {
    this.themeToggled.emit();
  }

  isHomeActive(): boolean {
    return this.router.url === '/home' || this.router.url === '/dashboard' || this.router.url === '/';
  }

  isInventoryActive(): boolean {
    return this.router.url.startsWith('/inventory');
  }

  isInventoryItemsActive(): boolean {
    return this.router.url.startsWith('/inventory/items') || this.router.url === '/inventory';
  }

  isIngredientsActive(): boolean {
    return this.router.url.startsWith('/inventory/ingredients');
  }

  isIngredientGroupsActive(): boolean {
    return this.router.url.startsWith('/inventory/groups');
  }

  isNutrientGroupsActive(): boolean {
    return this.router.url.startsWith('/inventory/nutrients');
  }

  isRecipesActive(): boolean {
    return this.router.url.startsWith('/recipes');
  }

  isShoppingListActive(): boolean {
    return this.router.url.startsWith('/shopping-list');
  }

  isMealPlannerActive(): boolean {
    return this.router.url.startsWith('/meal-planner');
  }
}
