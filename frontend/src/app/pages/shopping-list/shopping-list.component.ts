import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ShoppingItem } from '@models/shopping-list.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { MenuItem } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';

import {
  CardSurfaceDirective,
  EmptyStateComponent,
  FormFieldComponent,
  SkeletonComponent,
} from '@ui';

const ALL_STORES = 'all';
const NO_STORE = '__no_store__';
/** The checklist keeps 720px; the cart only gets its own column once the shell has room for it. */
const CART_RAIL_QUERY = '(min-width: 1280px)';

interface StoreOption {
  value: string;
  label: string;
}

interface StoreGroup {
  key: string;
  name: string | null;
  items: ShoppingItem[];
}

const storeKey = (item: ShoppingItem): string => item.storeName?.trim() || NO_STORE;

const compareByName = (a: ShoppingItem, b: ShoppingItem): number => a.name.localeCompare(b.name);

@Component({
  selector: 'pantry-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslocoModule,
    CheckboxModule,
    MenuModule,
    SelectModule,
    CardSurfaceDirective,
    EmptyStateComponent,
    FormFieldComponent,
    SkeletonComponent,
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListComponent {
  private readonly router = inject(Router);
  readonly shoppingListService = inject(ShoppingListService);
  readonly mealPlannerService = inject(MealPlannerService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lang = toSignal(this.transloco.langChanges$);
  private readonly cartRailQuery: MediaQueryList | null =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(CART_RAIL_QUERY)
      : null;

  readonly storeFilter = signal<string>(ALL_STORES);
  readonly cartExpanded = signal(false);
  readonly menuOpen = signal(false);
  readonly cartRail = signal(this.cartRailQuery?.matches ?? false);

  readonly moreActions = computed<MenuItem[]>(() => {
    this.lang();
    return [
      {
        label: this.transloco.translate('shoppingList.actions.manageStores'),
        icon: 'pi pi-map-marker',
        command: () => this.goToStoreManagement(),
      },
      {
        label: this.transloco.translate('shoppingList.actions.syncMealPlan'),
        icon: 'pi pi-sync',
        command: () => this.autoFillFromMealPlanner(),
      },
    ];
  });

  readonly storeOptions = computed<StoreOption[]>(() => {
    this.lang();
    const items = this.shoppingListService.items();
    const names = [
      ...new Set(
        items.map((item) => item.storeName?.trim()).filter((name): name is string => !!name),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const options: StoreOption[] = [
      { value: ALL_STORES, label: this.transloco.translate('shoppingList.store.all') },
      ...names.map((name) => ({ value: name, label: name })),
    ];
    if (items.some((item) => storeKey(item) === NO_STORE)) {
      options.push({ value: NO_STORE, label: this.transloco.translate('shoppingList.store.none') });
    }
    return options;
  });

  readonly selectedStoreName = computed(() => {
    const filter = this.storeFilter();
    return this.storeOptions().find((option) => option.value === filter)?.label ?? '';
  });

  private readonly itemsInFilter = computed(() => {
    const filter = this.storeFilter();
    const items = this.shoppingListService.items();
    return filter === ALL_STORES ? items : items.filter((item) => storeKey(item) === filter);
  });

  readonly toBuyGroups = computed<StoreGroup[]>(() => {
    const groups = new Map<string, StoreGroup>();
    for (const item of this.itemsInFilter().filter((i) => !i.checked)) {
      const key = storeKey(item);
      const group = groups.get(key) ?? {
        key,
        name: key === NO_STORE ? null : key,
        items: [],
      };
      group.items.push(item);
      groups.set(key, group);
    }
    return [...groups.values()]
      .map((group) => ({ ...group, items: [...group.items].sort(compareByName) }))
      .sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });
  });

  readonly cartItems = computed(() =>
    this.itemsInFilter()
      .filter((item) => item.checked)
      .sort(compareByName),
  );

  readonly cartSummary = computed(() =>
    this.cartItems()
      .map((item) => item.name)
      .join(', '),
  );

  readonly showCartRail = computed(
    () =>
      this.cartRail() &&
      !this.shoppingListService.isLoading() &&
      this.shoppingListService.items().length > 0,
  );

  private readonly onCartRailChange = (event: MediaQueryListEvent): void =>
    this.cartRail.set(event.matches);

  constructor() {
    this.cartRailQuery?.addEventListener('change', this.onCartRailChange);
    this.destroyRef.onDestroy(() =>
      this.cartRailQuery?.removeEventListener('change', this.onCartRailChange),
    );

    effect(() => {
      const filter = this.storeFilter();
      if (!this.storeOptions().some((option) => option.value === filter)) {
        this.storeFilter.set(ALL_STORES);
      }
    });
  }

  goToAddItemPage(): void {
    this.router.navigate(['/shopping-list/new']);
  }

  goToStoreManagement(): void {
    this.router.navigate(['/shopping-list/stores']);
  }

  autoFillFromMealPlanner(): void {
    this.mealPlannerService.addAllMissingToShoppingList();
  }

  toggleItem(id: string): void {
    this.shoppingListService.toggleItem(id);
  }

  toggleCart(): void {
    this.cartExpanded.update((open) => !open);
  }

  goToRestock(): void {
    if (this.storeFilter() === ALL_STORES) {
      this.router.navigate(['/shopping-list/restock']);
      return;
    }
    const ids = this.cartItems().map((item) => item.id);
    this.router.navigate(['/shopping-list/restock'], { queryParams: { ids: ids.join(',') } });
  }
}
