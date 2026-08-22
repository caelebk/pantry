import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { ToastService } from '@services/toast.service';
import {
  getTimeDifferenceString,
  isExpired,
  isExpiringSoon,
} from '@utility/itemUtility/ItemUtility';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../core/services/auth.service';

export type StatusFilterOption = 'all' | 'in-stock' | 'out-of-stock';

import { EmptyStateComponent, SearchInputComponent } from '@ui';

@Component({
  selector: 'pantry-ingredients-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TranslocoModule,
    SearchInputComponent,
    EmptyStateComponent,
  ],
  templateUrl: './ingredients-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsPageComponent {
  private readonly router = inject(Router);
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
  public selectedGroup = signal<IngredientGroup | null>(null);
  public selectedStatusFilter = signal<StatusFilterOption>('all');

  // Object tracking expanded row keys: Record<string, boolean>
  public expandedRows = signal<Record<string, boolean>>({});

  // Native Table Sorting & Pagination Controls
  public sortBy = signal<'name' | 'group' | 'unit' | 'status'>('group');
  public sortDirection = signal<'asc' | 'desc'>('asc');
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(15);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.isLoading.set(true);

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.itemService.getItems().subscribe({
      next: (items) => this.items.set(items),
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ings) => {
        this.ingredients.set(ings);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ingredients:', err);
        this.toastService.showError('Unable to load ingredients catalog.');
        this.isLoading.set(false);
      },
    });
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

  public totalPages = computed(
    () => Math.ceil(this.filteredIngredients().length / this.pageSize()) || 1,
  );
  public startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  public endIndex = computed(() =>
    Math.min(this.startIndex() + this.pageSize(), this.filteredIngredients().length),
  );

  public displayedIngredients = computed(() => {
    return this.filteredIngredients().slice(this.startIndex(), this.endIndex());
  });

  public visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  public onPageSizeChange(size: number | string): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
  }

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
    this.resetPagination();
  }

  public setStatusFilter(status: StatusFilterOption): void {
    this.selectedStatusFilter.set(status);
    this.resetPagination();
  }

  public isRowExpanded(id: string): boolean {
    return Boolean(this.expandedRows()[id]);
  }

  public toggleRowExpansion(id: string): void {
    const current = { ...this.expandedRows() };
    if (current[id]) {
      delete current[id];
    } else {
      current[id] = true;
    }
    this.expandedRows.set(current);
  }

  public expandAll(): void {
    const newExpanded: Record<string, boolean> = {};
    for (const ing of this.filteredIngredients()) {
      newExpanded[ing.id] = true;
    }
    this.expandedRows.set(newExpanded);
  }

  public collapseAll(): void {
    this.expandedRows.set({});
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

  onAddStockItemForIngredient(ing?: Ingredient): void {
    if (ing?.id) {
      this.router.navigate(['/inventory/items/new'], {
        queryParams: { ingredientId: ing.id },
      });
    } else {
      this.router.navigate(['/inventory/items/new']);
    }
  }

  onEditItem(item: Item): void {
    this.router.navigate(['/inventory/items', item.id, 'edit']);
  }

  onDeleteItem(item: Item): void {
    if (confirm(`Are you sure you want to delete "${item.name}" from physical inventory?`)) {
      this.itemService.removeItem(item).subscribe({
        next: () => {
          this.toastService.showSuccess(`Item "${item.name}" removed from inventory.`);
          this.loadData();
        },
        error: (err: unknown) => {
          console.error('Failed to delete item:', err);
          this.toastService.showError('Failed to remove item.');
        },
      });
    }
  }

  getItemStatus(item: Item): { text: string; colorClass: string } {
    if (isExpired(item)) {
      return {
        text: 'Expired',
        colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      };
    }
    if (isExpiringSoon(item)) {
      return {
        text: 'Expiring Soon',
        colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    }
    return {
      text: 'Fresh',
      colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    };
  }

  getItemRemainingText(item: Item): string {
    if (!item.expirationDate) return 'No expiry';
    return item.expirationDate
      ? getTimeDifferenceString(new Date(), item.expirationDate)
      : 'No Expiration';
  }
}
