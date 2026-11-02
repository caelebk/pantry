import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { ToastService } from '@services/toast.service';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../../core/services/auth.service';

import { forkJoin, Subscription } from 'rxjs';
import { IngredientCatalogStateService } from './ingredient-catalog-state.service';

export type StatusFilterOption = 'all' | 'in-stock' | 'out-of-stock';

import {
  BadgeComponent,
  DataTablePaginationComponent,
  EmptyStateComponent,
  SearchInputComponent,
} from '@ui';

@Component({
  selector: 'pantry-ingredients-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    SelectModule,
    SkeletonModule,
    TranslocoModule,
    SearchInputComponent,
    EmptyStateComponent,
    BadgeComponent,
    DataTablePaginationComponent,
  ],
  templateUrl: './ingredients-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsPageComponent implements OnDestroy {
  private readonly catalogState = inject(IngredientCatalogStateService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private kitchenId: string | null = null;
  private request?: Subscription;
  private readonly router = inject(Router);
  private readonly historyReturn = this.router.getCurrentNavigation()?.trigger === 'popstate';
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  private queryKey: string | undefined;
  private pendingGroupQuery = false;
  private linkedGroupId: number | null = null;
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly itemService = inject(ItemService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  public ingredients = signal<Ingredient[]>([]);
  public items = signal<Item[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public isLoading = signal<boolean>(true);
  public searchQuery = signal<string>('');
  public readonly fromGroups = computed(() => this.queryParams().get('from') === 'groups');
  public unavailableGroup = signal(false);
  public selectedGroup = signal<IngredientGroup | null>(null);
  public selectedStatusFilter = signal<StatusFilterOption>('all');

  // Native Table Sorting Controls
  public sortBy = signal<'name' | 'group' | 'unit' | 'status'>('group');
  public sortDirection = signal<'asc' | 'desc'>('asc');
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(15);

  constructor() {
    effect(() => {
      const kitchen = this.authService.activeKitchen();
      const params = this.queryParams();
      const groupId = params.get('groupId');
      const fromGroups = params.get('from') === 'groups';
      const queryKey = JSON.stringify([groupId, fromGroups]);
      untracked(() => {
        const kitchenChanged = kitchen?.id !== this.kitchenId;
        const queryChanged = queryKey !== this.queryKey;
        if (!kitchenChanged && !queryChanged) return;
        if (kitchenChanged) {
          this.saveView();
          this.request?.unsubscribe();
          this.kitchenId = kitchen?.id ?? null;
          const saved = this.kitchenId ? this.catalogState.views.get(this.kitchenId) : undefined;
          this.searchQuery.set(saved?.search ?? '');
          this.selectedGroup.set(saved?.group ?? null);
          this.selectedStatusFilter.set(saved?.status ?? 'all');
          this.sortBy.set(saved?.sort ?? 'group');
          this.sortDirection.set(saved?.direction ?? 'asc');
          this.currentPage.set(saved?.page ?? 1);
          this.pageSize.set(saved?.pageSize ?? 15);
          this.unavailableGroup.set(false);
          this.ingredients.set([]);
          this.items.set([]);
          this.ingredientGroups.set([]);
        }
        const explicitGroup = groupId !== null || fromGroups;
        const saved = this.kitchenId ? this.catalogState.views.get(this.kitchenId) : undefined;
        const restoreHistory =
          this.queryKey === undefined && this.historyReturn && saved?.queryKey === queryKey;
        if (explicitGroup && !restoreHistory) {
          const id = groupId && /^[1-9]\d*$/.test(groupId) ? Number(groupId) : null;
          this.linkedGroupId = id !== null && Number.isSafeInteger(id) ? id : null;
          this.pendingGroupQuery = true;
          this.searchQuery.set('');
          this.selectedGroup.set(null);
          this.selectedStatusFilter.set('all');
          this.resetPagination();
          this.unavailableGroup.set(false);
        } else if (queryChanged && this.queryKey !== undefined && !kitchenChanged) {
          this.pendingGroupQuery = false;
          this.selectedGroup.set(null);
          this.unavailableGroup.set(false);
          this.resetPagination();
        }
        this.queryKey = queryKey;
        if (kitchenChanged && kitchen) {
          const saved = this.catalogState.views.get(kitchen.id);
          this.loadData(explicitGroup && !restoreHistory ? 0 : (saved?.scrollTop ?? 0));
        } else if (!this.isLoading()) {
          this.applyGroupQuery();
        }
      });
    });
  }

  private applyGroupQuery(): void {
    if (!this.pendingGroupQuery) return;
    const group = this.ingredientGroups().find((candidate) => candidate.id === this.linkedGroupId);
    this.selectedGroup.set(group ?? null);
    this.unavailableGroup.set(!group);
    this.pendingGroupQuery = false;
  }

  private get scrollContainer(): HTMLElement | null {
    return this.host.nativeElement.closest('main')?.parentElement ?? null;
  }

  private saveView(): void {
    if (!this.kitchenId) return;
    this.catalogState.views.set(this.kitchenId, {
      search: this.searchQuery(),
      queryKey: this.queryKey,
      group: this.selectedGroup(),
      status: this.selectedStatusFilter(),
      sort: this.sortBy(),
      direction: this.sortDirection(),
      page: this.currentPage(),
      pageSize: this.pageSize(),
      scrollTop: this.scrollContainer?.scrollTop ?? 0,
    });
  }

  ngOnDestroy(): void {
    this.saveView();
    this.request?.unsubscribe();
  }

  loadData(scrollTop?: number): void {
    this.request?.unsubscribe();
    this.isLoading.set(true);
    this.request = forkJoin({
      groups: this.ingredientGroupService.getIngredientGroups(),
      items: this.itemService.getItems(),
      ingredients: this.ingredientService.getIngredients(),
    }).subscribe({
      next: ({ groups, items, ingredients }) => {
        this.ingredientGroups.set(groups);
        this.items.set(items);
        this.ingredients.set(ingredients);
        this.applyGroupQuery();
        this.isLoading.set(false);
        if (scrollTop !== undefined) {
          afterNextRender(
            () => {
              if (this.scrollContainer) this.scrollContainer.scrollTop = scrollTop;
            },
            { injector: this.injector },
          );
        }
      },
      error: () => {
        this.toastService.showError('Unable to load ingredients catalog.');
        this.isLoading.set(false);
      },
    });
  }

  openIngredient(event: MouseEvent, ingredient: Ingredient): void {
    if ((event.target as HTMLElement).closest('a, button, input, select')) return;
    this.router.navigate(['/inventory/ingredients', ingredient.id]);
  }

  public connectedItemsMap = computed(() => {
    const map = new Map<string, Item[]>();
    for (const item of this.items()) {
      if (item.ingredientId) {
        const list = map.get(item.ingredientId) || [];
        list.push(item);
        map.set(item.ingredientId, list);
      }
    }
    return map;
  });

  public quantitySummaryMap = computed(() => {
    const summaryMap = new Map<string, string>();
    const itemsMap = this.connectedItemsMap();

    itemsMap.forEach((connected, ingId) => {
      if (connected.length === 0) {
        summaryMap.set(ingId, '0 items');
        return;
      }
      const unitMap = new Map<string, number>();
      for (const item of connected) {
        const unitName = item.unit.shortName || item.unit.name;
        unitMap.set(unitName, (unitMap.get(unitName) || 0) + item.quantity);
      }
      const parts: string[] = [];
      unitMap.forEach((qty, unit) => {
        parts.push(`${qty} ${unit}`);
      });
      summaryMap.set(ingId, parts.join(', '));
    });

    return summaryMap;
  });

  getConnectedItems(ingredientId: string): Item[] {
    return this.connectedItemsMap().get(ingredientId) || [];
  }

  getTotalQuantityText(ingredientId: string): string {
    return this.quantitySummaryMap().get(ingredientId) || '0 items';
  }

  // Summary Metrics
  public totalCount = computed(() => this.ingredients().length);
  public inStockCount = computed(
    () => this.ingredients().filter((ing) => this.getConnectedItems(ing.id).length > 0).length,
  );
  public outOfStockCount = computed(
    () => this.ingredients().filter((ing) => this.getConnectedItems(ing.id).length === 0).length,
  );

  public filteredIngredients = computed(() => {
    const list = this.ingredients();
    const query = this.searchQuery().toLowerCase().trim();
    const group = this.selectedGroup();
    const status = this.selectedStatusFilter();

    const filtered = list.filter((ing) => {
      const groupName = ing.ingredientGroup?.name || '';
      const matchesSearch =
        !query || ing.name.toLowerCase().includes(query) || groupName.toLowerCase().includes(query);

      const matchesGroup = !group || ing.ingredientGroup?.id === group.id;

      const connectedCount = this.getConnectedItems(ing.id).length;
      let matchesStatus = true;
      if (status === 'in-stock') matchesStatus = connectedCount > 0;
      if (status === 'out-of-stock') matchesStatus = connectedCount === 0;

      return matchesSearch && matchesGroup && matchesStatus;
    });

    const key = this.sortBy();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (key === 'name') {
        return a.name.localeCompare(b.name) * dir;
      }
      if (key === 'group') {
        const gA = a.ingredientGroup?.name || 'ZZZ';
        const gB = b.ingredientGroup?.name || 'ZZZ';
        const cmp = gA.localeCompare(gB);
        return (cmp !== 0 ? cmp : a.name.localeCompare(b.name)) * dir;
      }
      if (key === 'unit') {
        const uA = a.defaultUnit?.name || '';
        const uB = b.defaultUnit?.name || '';
        return uA.localeCompare(uB) * dir;
      }
      if (key === 'status') {
        const sA = this.getConnectedItems(a.id).length;
        const sB = this.getConnectedItems(b.id).length;
        return (sA - sB) * dir;
      }
      return 0;
    });
  });

  public startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  public endIndex = computed(() =>
    Math.min(this.startIndex() + this.pageSize(), this.filteredIngredients().length),
  );

  public displayedIngredients = computed(() => {
    return this.filteredIngredients().slice(this.startIndex(), this.endIndex());
  });

  public resetPagination(): void {
    this.currentPage.set(1);
  }

  public toggleSort(column: 'name' | 'group' | 'unit' | 'status'): void {
    this.resetPagination();
    if (this.sortBy() === column) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }
  }

  public onSearchChange(query: string): void {
    this.searchQuery.set(query || '');
    this.resetPagination();
  }

  public onGroupChange(group: IngredientGroup | null): void {
    this.selectedGroup.set(group);
    this.unavailableGroup.set(false);
    this.resetPagination();
  }

  public setStatusFilter(status: StatusFilterOption): void {
    this.selectedStatusFilter.set(status);
    this.resetPagination();
  }

  onAddIngredient(): void {
    this.router.navigate(['/inventory/ingredients/new']);
  }

  onEditIngredient(ing: Ingredient): void {
    this.router.navigate(['/inventory/ingredients', ing.id, 'edit']);
  }

  onDeleteIngredient(ing: Ingredient): void {
    if (confirm(`Are you sure you want to delete "${ing.name}" from the ingredients catalog?`)) {
      this.ingredientService.deleteIngredient(ing.id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Ingredient "${ing.name}" deleted.`);
          this.loadData();
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.toastService.showError(
            'Failed to delete ingredient. It may have items associated with it.',
          );
        },
      });
    }
  }
}
