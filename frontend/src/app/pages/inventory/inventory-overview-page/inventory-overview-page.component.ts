import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { isExpired, isExpiringSoon } from '@utility/itemUtility/ItemUtility';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

export interface LocationStat {
  id: number;
  name: string;
  count: number;
  icon: string;
}

@Component({
  selector: 'pantry-inventory-overview-page',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './inventory-overview-page.component.html',
})
export class InventoryOverviewPageComponent {
  private readonly router = inject(Router);
  private readonly categoryService = inject(IngredientCategoryService);
  private readonly groupService = inject(IngredientGroupService);
  private readonly ingredientService = inject(IngredientService);
  private readonly itemService = inject(ItemService);
  private readonly locationService = inject(LocationService);
  private readonly authService = inject(AuthService);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.fetchInventoryData();
      }
    });
  }

  public readonly categories = signal<IngredientCategory[]>([]);
  public readonly groups = signal<IngredientGroup[]>([]);
  public readonly ingredients = signal<Ingredient[]>([]);
  public readonly items = signal<Item[]>([]);
  public readonly locations = signal<Location[]>([]);
  public readonly isLoading = signal<boolean>(true);

  // Active collapsible pyramid tier (defaults to Tier 4 - Physical Stock)
  public readonly expandedTier = signal<number | null>(4);

  public toggleTier(tier: number): void {
    this.expandedTier.update((current) => (current === tier ? null : tier));
  }

  // Computed metrics
  public readonly categoriesCount = computed(() => this.categories().length);
  public readonly groupsCount = computed(() => this.groups().length);
  public readonly ingredientsCount = computed(() => this.ingredients().length);
  public readonly itemsCount = computed(() => this.items().length);

  public readonly expiringCount = computed(
    () => this.items().filter((item) => isExpiringSoon(item, 7)).length,
  );
  public readonly expiredCount = computed(
    () => this.items().filter((item) => isExpired(item)).length,
  );
  public readonly freshCount = computed(
    () => this.items().filter((item) => !isExpired(item) && !isExpiringSoon(item, 7)).length,
  );

  public readonly locationStats = computed<LocationStat[]>(() => {
    const locs = this.locations();
    const allItems = this.items();
    return locs.map((loc) => {
      const count = allItems.filter((item) => item.location?.id === loc.id).length;
      let icon = 'pi pi-compass';
      const locLower = loc.name.toLowerCase();
      if (locLower.includes('fridge') || locLower.includes('refrigerator')) {
        icon = 'pi pi-box';
      } else if (locLower.includes('freezer')) {
        icon = 'pi pi-sun';
      } else if (locLower.includes('pantry') || locLower.includes('cabinet')) {
        icon = 'pi pi-folder';
      }
      return {
        id: loc.id,
        name: loc.name,
        count,
        icon,
      };
    });
  });

  public fetchInventoryData(): void {
    this.isLoading.set(true);
    forkJoin({
      categories: this.categoryService.getIngredientCategories(),
      groups: this.groupService.getIngredientGroups(),
      ingredients: this.ingredientService.getIngredients(),
      items: this.itemService.getItems(),
      locations: this.locationService.getLocations(),
    }).subscribe({
      next: (data) => {
        this.categories.set(data.categories || []);
        this.groups.set(data.groups || []);
        this.ingredients.set(data.ingredients || []);
        this.items.set(data.items || []);
        this.locations.set(data.locations || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching inventory overview data:', err);
        this.isLoading.set(false);
      },
    });
  }

  public navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
