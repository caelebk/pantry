import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { BadgeComponent, EmptyStateComponent, SpinnerComponent } from '@ui';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { expiryBucket } from './inventory-overview-stock';

type Collection = 'categories' | 'groups' | 'ingredients' | 'items' | 'locations';
type LoadState = 'loading' | 'ready' | 'error' | 'idle';

@Component({
  selector: 'pantry-inventory-overview-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    RouterLink,
    BadgeComponent,
    EmptyStateComponent,
    SpinnerComponent,
  ],
  templateUrl: './inventory-overview-page.component.html',
  styleUrl: './inventory-overview-page.component.scss',
})
export class InventoryOverviewPageComponent {
  private readonly categoryService = inject(IngredientCategoryService);
  private readonly groupService = inject(IngredientGroupService);
  private readonly ingredientService = inject(IngredientService);
  private readonly itemService = inject(ItemService);
  private readonly locationService = inject(LocationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private requests = new Subscription();
  private generation = 0;
  readonly now = signal(Date.now());
  readonly categories = signal<IngredientCategory[]>([]);
  readonly groups = signal<IngredientGroup[]>([]);
  readonly ingredients = signal<Ingredient[]>([]);
  readonly items = signal<Item[]>([]);
  readonly locations = signal<Location[]>([]);
  readonly sectionStates = signal<Record<Collection, LoadState>>({
    categories: 'idle',
    groups: 'idle',
    ingredients: 'idle',
    items: 'idle',
    locations: 'idle',
  });
  readonly isLoading = computed(() => Object.values(this.sectionStates()).includes('loading'));
  readonly loadError = computed(() => Object.values(this.sectionStates()).includes('error'));
  readonly categoriesCount = computed(() => this.categories().length);
  readonly groupsCount = computed(() => this.groups().length);
  readonly ingredientsCount = computed(() => this.ingredients().length);
  readonly itemsCount = computed(() => this.items().length);
  readonly stockedItems = computed(() => this.items().filter((item) => item.quantity > 0));
  readonly stockedItemsCount = computed(() => this.stockedItems().length);
  readonly stockedIngredientIds = computed(
    () => new Set(this.stockedItems().map((item) => item.ingredientId)),
  );
  readonly stockedIngredientsCount = computed(
    () =>
      this.ingredients().filter((ingredient) => this.stockedIngredientIds().has(ingredient.id))
        .length,
  );
  readonly ungroupedCount = computed(
    () =>
      this.ingredients().filter(
        (ingredient) => !(ingredient.ingredientGroup ?? ingredient.category),
      ).length,
  );
  readonly expiredCount = computed(
    () => this.items().filter((item) => expiryBucket(item, this.now()) === 'expired').length,
  );
  readonly expiringCount = computed(
    () => this.items().filter((item) => expiryBucket(item, this.now()) === 'expiring').length,
  );
  readonly undatedCount = computed(
    () => this.items().filter((item) => expiryBucket(item, this.now()) === 'undated').length,
  );
  readonly attentionItems = computed(() =>
    this.items()
      .filter((item) => ['expired', 'expiring'].includes(expiryBucket(item, this.now())))
      .sort((a, b) => {
        const priority =
          Number(expiryBucket(a, this.now()) !== 'expired') -
          Number(expiryBucket(b, this.now()) !== 'expired');
        return (
          priority ||
          new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime() ||
          a.name.localeCompare(b.name) ||
          a.id.localeCompare(b.id)
        );
      })
      .slice(0, 3),
  );
  readonly ingredientsSummaryState = computed<
    'ready-full' | 'ready-ingredients-only' | 'loading' | 'unavailable'
  >(() => {
    const states = this.sectionStates();
    if (states.ingredients === 'error' || states.ingredients === 'idle') {
      return 'unavailable';
    }
    if (states.ingredients === 'loading') {
      return 'loading';
    }
    if (states.items === 'ready') {
      return 'ready-full';
    }
    return 'ready-ingredients-only';
  });
  readonly itemsSummaryState = computed<'ready' | 'loading' | 'unavailable'>(() => {
    const states = this.sectionStates();
    if (states.items === 'loading') {
      return 'loading';
    }
    if (states.items === 'ready') {
      return 'ready';
    }
    return 'unavailable';
  });
  readonly groupsSummaryState = computed<'ready' | 'loading' | 'unavailable'>(() => {
    const states = this.sectionStates();
    if (states.categories === 'error' || states.groups === 'error') {
      return 'unavailable';
    }
    if (states.categories === 'loading' || states.groups === 'loading') {
      return 'loading';
    }
    if (states.categories === 'ready' && states.groups === 'ready') {
      return 'ready';
    }
    return 'unavailable';
  });
  readonly locationStats = computed(() => {
    const counts = new Map<number, number>();
    const known = new Set(this.locations().map((location) => location.id));
    let unmatched = 0;
    for (const item of this.stockedItems()) {
      if (known.has(item.location?.id))
        counts.set(item.location.id, (counts.get(item.location.id) ?? 0) + 1);
      else unmatched++;
    }
    const stats: { id: number | 'none'; name: string; count: number }[] = this.locations().map(
      (location) => ({ id: location.id, name: location.name, count: counts.get(location.id) ?? 0 }),
    );
    if (unmatched) stats.push({ id: 'none', name: '', count: unmatched });
    return stats.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  });

  constructor() {
    effect(() => {
      const kitchen = this.authService.activeKitchen();
      this.clear();
      if (kitchen) this.fetchInventoryData();
    });
    const resume = () => {
      if (document.visibilityState === 'visible') this.now.set(Date.now());
    };
    document.addEventListener('visibilitychange', resume);
    this.destroyRef.onDestroy(() => {
      this.requests.unsubscribe();
      document.removeEventListener('visibilitychange', resume);
    });
  }

  ready(...collections: Collection[]): boolean {
    return collections.every((key) => this.sectionStates()[key] === 'ready');
  }
  locationName(item: Item): string {
    return item.location?.name ?? '';
  }

  bucket(item: Item): string {
    return expiryBucket(item, this.now());
  }
  expiryTiming(item: Item): { key: string; count: number } {
    const expiry = new Date(item.expirationDate!);
    const today = new Date(this.now());
    // Use calendar days in the same local timezone as DatePipe, including across DST.
    const calendarDay = (date: Date) =>
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const days = Math.round((calendarDay(expiry) - calendarDay(today)) / 86_400_000);
    const expired = this.bucket(item) === 'expired';
    const key = expired
      ? days === 0
        ? 'expiredToday'
        : days === -1
          ? 'expiredYesterday'
          : 'expiredDays'
      : days === 0
        ? 'dueToday'
        : days === 1
          ? 'dueTomorrow'
          : 'dueDays';
    return { key, count: Math.abs(days) };
  }

  private clear(): void {
    this.generation++;
    this.requests.unsubscribe();
    this.requests = new Subscription();
    this.categories.set([]);
    this.groups.set([]);
    this.ingredients.set([]);
    this.items.set([]);
    this.locations.set([]);
    this.sectionStates.set({
      categories: 'idle',
      groups: 'idle',
      ingredients: 'idle',
      items: 'idle',
      locations: 'idle',
    });
  }
  fetchInventoryData(): void {
    this.clear();
    this.now.set(Date.now());
    const generation = this.generation;
    this.sectionStates.set({
      categories: 'loading',
      groups: 'loading',
      ingredients: 'loading',
      items: 'loading',
      locations: 'loading',
    });
    const load = <T>(key: Collection, source: Observable<T[]>, target: WritableSignal<T[]>) => {
      this.requests.add(
        source.subscribe({
          next: (data) => {
            if (generation !== this.generation) return;
            target.set(data);
            this.sectionStates.update((states) => ({ ...states, [key]: 'ready' }));
          },
          error: () => {
            if (generation === this.generation)
              this.sectionStates.update((states) => ({ ...states, [key]: 'error' }));
          },
        }),
      );
    };
    load('categories', this.categoryService.getIngredientCategories(), this.categories);
    load('groups', this.groupService.getIngredientGroups(), this.groups);
    load('ingredients', this.ingredientService.getIngredients(), this.ingredients);
    load('items', this.itemService.getItems(), this.items);
    load('locations', this.locationService.getLocations(), this.locations);
  }
}
