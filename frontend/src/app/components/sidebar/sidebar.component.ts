import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { filter, map } from 'rxjs/operators';
import { Tab } from '../tabs/tabs.model';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'pantry-sidebar',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  darkMode = input(true);
  activeTab = input<Tab>(Tab.Home);
  themeToggled = output<void>();
  logoutClicked = output<void>();
  tabSelected = output<Tab>();

  tabs = Tab;
  mobileMenuOpen = signal(false);
  isCollapsed = signal(false);
  inventoryExpanded = signal(true);
  kitchenMenuOpen = signal(false);

  toggleKitchenMenu(event?: Event): void {
    if (event) event.stopPropagation();
    this.kitchenMenuOpen.update((v) => !v);
  }

  selectKitchen(kitchen: import('../../core/models/auth.model').Kitchen): void {
    this.authService.setActiveKitchen(kitchen);
    this.kitchenMenuOpen.set(false);
  }

  // Reactive URL signal driven by Router events for OnPush change detection
  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects || e.url),
    ),
    { initialValue: this.router.url },
  );

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  toggleInventoryExpanded(event?: Event): void {
    if (event) event.stopPropagation();
    this.inventoryExpanded.update((v) => !v);
  }

  onToggleTheme(): void {
    this.themeToggled.emit();
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }

  navigateTo(path: string): void {
    this.mobileMenuOpen.set(false);
    this.kitchenMenuOpen.set(false);
    this.router.navigate([path]);
  }

  private get url(): string {
    return this.currentUrl() || this.router.url || '';
  }

  isHomeActive(): boolean {
    const url = this.url;
    return url === '/' || url.startsWith('/home') || url.startsWith('/dashboard');
  }

  isInventoryActive(): boolean {
    return this.url.startsWith('/inventory');
  }

  isIngredientsActive(): boolean {
    const url = this.url;
    return url === '/inventory/ingredients' || url.startsWith('/inventory/ingredients/');
  }

  isInventoryItemsActive(): boolean {
    const url = this.url;
    return url === '/inventory/items' || url.startsWith('/inventory/items/');
  }

  isIngredientGroupsActive(): boolean {
    const url = this.url;
    return (
      url === '/inventory/groups' ||
      url.startsWith('/inventory/groups/') ||
      url.startsWith('/inventory/categories') ||
      url.startsWith('/inventory/nutrients')
    );
  }

  isRecipesActive(): boolean {
    return this.url.startsWith('/recipes');
  }

  isShoppingListActive(): boolean {
    return this.url.startsWith('/shopping-list');
  }

  isMealPlannerActive(): boolean {
    return this.url.startsWith('/meal-planner');
  }

  isProfileActive(): boolean {
    return this.url.startsWith('/profile');
  }
}
