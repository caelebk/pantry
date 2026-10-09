import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme } from '@models/items.model';
import { Location } from '@models/location.model';
import { Recipe } from '@models/recipe.model';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { EmptyStateComponent, SkeletonComponent } from '@ui';
import { isExpired, isExpiringSoon } from '@utility/itemUtility/ItemUtility';
import { CookableRecipesContainerComponent } from './home-components/cookable-recipes-container/cookable-recipes-container.component';
import { ItemsContainerComponent } from './home-components/items-container/items-container.component';
import { LocationOverviewContainerComponent } from './home-components/location-overview-container/location-overview-container.component';

import { ChangeDetectionStrategy, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'pantry-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    SkeletonComponent,
    EmptyStateComponent,
    ItemsContainerComponent,
    LocationOverviewContainerComponent,
    CookableRecipesContainerComponent,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly Theme = ItemsContainerTheme;
  private readonly itemService = inject(ItemService);
  private readonly recipeService = inject(RecipeService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  items = signal<Item[]>([]);
  recipes = signal<Recipe[]>([]);
  locations = signal<Location[]>([]);
  expiredItems = signal<Item[]>([]);
  soonToExpireItems = signal<Item[]>([]);

  totalItemsCount = computed(() => this.items().length);
  expiredItemsCount = computed(() => this.expiredItems().length);
  expiringSoonItemsCount = computed(() => this.soonToExpireItems().length);

  kitchenName = computed(() => this.authService.activeKitchen()?.name || 'My Kitchen');

  currentDateString = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return new Date().toLocaleDateString(undefined, options);
  });

  isLoading = signal(true);
  loadFailed = signal(false);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.fetchData();
      }
    });
  }

  fetchData(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    forkJoin({
      items: this.itemService.getItems(),
      recipes: this.recipeService.getAvailableRecipes(),
      locations: this.locationService.getLocations(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items, recipes, locations }) => {
          this.items.set(items);
          this.expiredItems.set(items.filter((item) => isExpired(item)));
          this.soonToExpireItems.set(items.filter((item) => isExpiringSoon(item, 7)));
          this.recipes.set(recipes);
          this.locations.set(locations);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load home data:', err);
          this.loadFailed.set(true);
          this.isLoading.set(false);
        },
      });
  }

  onRemoveItem(item: Item): void {
    if (confirm(`Remove "${item.name}" from inventory?`)) {
      this.itemService
        .removeItem(item)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.showSuccess(`Removed "${item.name}"`, 'Item successfully removed.');
            this.fetchData();
          },
          error: (err) => {
            console.error('Failed to remove item:', err);
            this.toastService.showError('Error', 'Failed to remove item.');
          },
        });
    }
  }

  onReviewExpired(): void {
    const el = document.getElementById('expired-items-section');
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    } else {
      this.router.navigate(['/inventory/items']);
    }
  }

  onNavigateToAddItem(): void {
    this.router.navigate(['/inventory/items/new']);
  }

  onNavigateToAddRecipe(): void {
    this.router.navigate(['/recipes/new']);
  }

  onNavigateToAssign(): void {
    this.router.navigate(['/inventory/items'], { queryParams: { tab: 'assign' } });
  }

  onNavigateToRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  onNavigateToInventory(): void {
    this.router.navigate(['/inventory/items']);
  }
}
