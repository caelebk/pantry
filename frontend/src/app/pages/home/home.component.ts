import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StatCardComponent } from '@components/stat-card/stat-card.component';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme } from '@models/items.model';
import { Location } from '@models/location.model';
import { Recipe } from '@models/recipe.model';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { isExpired, isExpiringSoon } from '@utility/itemUtility/ItemUtility';
import { CookableRecipesContainerComponent } from './home-components/cookable-recipes-container/cookable-recipes-container.component';
import { ItemsContainerComponent } from './home-components/items-container/items-container.component';
import { LocationOverviewContainerComponent } from './home-components/location-overview-container/location-overview-container.component';
import { QuickActionsContainerComponent } from './home-components/quick-actions-container/quick-actions-container.component';

@Component({
  selector: 'pantry-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    StatCardComponent,
    ItemsContainerComponent,
    QuickActionsContainerComponent,
    LocationOverviewContainerComponent,
    CookableRecipesContainerComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly Theme = ItemsContainerTheme;
  private readonly itemService = inject(ItemService);
  private readonly recipeService = inject(RecipeService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  items = signal<Item[]>([]);
  recipes = signal<Recipe[]>([]);
  locations = signal<Location[]>([]);
  expiredItems = signal<Item[]>([]);
  soonToExpireItems = signal<Item[]>([]);
  availableItems = signal<Item[]>([]);

  totalItemsCount = computed(() => this.items().length);
  expiredItemsCount = computed(() => this.expiredItems().length);
  expiringSoonItemsCount = computed(() => this.soonToExpireItems().length);
  canMakeRecipesCount = computed(() => this.recipes().length);

  freshnessPercentage = computed(() => {
    const total = this.totalItemsCount();
    if (!total) return 100;
    const fresh = this.availableItems().length;
    return Math.round((fresh / total) * 100);
  });

  greetingMessage = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  currentDateString = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return new Date().toLocaleDateString(undefined, options);
  });

  constructor() {
    this.fetchData();
  }

  fetchData(): void {
    this.itemService.getItems().subscribe({
      next: (items: Item[]) => {
        this.items.set(items);
        this.expiredItems.set(this.items().filter((item) => isExpired(item)));
        this.soonToExpireItems.set(this.items().filter((item) => isExpiringSoon(item)));
        this.availableItems.set(
          this.items().filter((item) => !isExpired(item) && !isExpiringSoon(item)),
        );
      },
      error: (err) => console.error('Failed to load items:', err),
    });

    this.recipeService.getAvailableRecipes().subscribe({
      next: (recipes: Recipe[]) => {
        this.recipes.set(recipes);
      },
      error: (err) => console.error('Failed to load recipes:', err),
    });

    this.locationService.getLocations().subscribe({
      next: (locations: Location[]) => {
        this.locations.set(locations);
      },
      error: (err) => console.error('Failed to load locations:', err),
    });
  }

  onRemoveItem(item: Item): void {
    if (confirm(`Remove "${item.name}" from inventory?`)) {
      this.itemService.removeItem(item).subscribe({
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
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      this.router.navigate(['/inventory']);
    }
  }

  onNavigateToAddItem(): void {
    this.router.navigate(['/inventory/new']);
  }

  onNavigateToAddRecipe(): void {
    this.router.navigate(['/recipes/new']);
  }

  onNavigateToAssign(): void {
    this.router.navigate(['/inventory'], { queryParams: { tab: 'assign' } });
  }

  onNavigateToRecipes(): void {
    this.router.navigate(['/recipes']);
  }

  onNavigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }
}
