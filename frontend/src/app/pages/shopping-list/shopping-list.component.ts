import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ShoppingItem } from '@models/shopping-list.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { ShoppingListService } from '@services/shopping-list.service';

@Component({
  selector: 'pantry-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListComponent {
  private readonly router = inject(Router);
  readonly shoppingListService = inject(ShoppingListService);
  readonly mealPlannerService = inject(MealPlannerService);

  // Filter state
  activeFilter = signal<'all' | 'unchecked' | 'checked'>('all');
  readonly searchQuery = signal('');
  readonly selectedIds = signal<Set<string>>(new Set());

  // Sort state
  readonly sortBy = signal<'name' | 'category' | 'store' | 'quantity' | 'price'>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  toggleSort(column: 'name' | 'category' | 'store' | 'quantity' | 'price'): void {
    if (this.sortBy() === column) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Inline click-to-edit states
  readonly editingQuantityId = signal<string | null>(null);
  readonly editingPriceId = signal<string | null>(null);

  startEditingQuantity(id: string): void {
    this.editingQuantityId.set(id);
  }

  stopEditingQuantity(): void {
    this.editingQuantityId.set(null);
  }

  startEditingPrice(id: string): void {
    this.editingPriceId.set(id);
  }

  stopEditingPrice(): void {
    this.editingPriceId.set(null);
  }

  // Filtered & sorted items signal
  readonly filteredItems = computed(() => {
    const items = this.shoppingListService.items();
    const filter = this.activeFilter();
    let result =
      filter === 'unchecked'
        ? items.filter((item) => !item.checked)
        : filter === 'checked'
          ? items.filter((item) => item.checked)
          : [...items];

    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (query) {
      result = result.filter((item) =>
        [item.name, item.category, item.storeName, item.recipeName].some((value) =>
          value?.toLocaleLowerCase().includes(query),
        ),
      );
    }

    const sortCol = this.sortBy();
    const isAsc = this.sortDirection() === 'asc';

    return result.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '');
          break;
        case 'store':
          cmp = (a.storeName || '').localeCompare(b.storeName || '');
          break;
        case 'quantity':
          cmp = a.quantity - b.quantity;
          break;
        case 'price':
          cmp = (a.estimatedPrice || 0) - (b.estimatedPrice || 0);
          break;
      }
      return isAsc ? cmp : -cmp;
    });
  });

  readonly totalCount = computed(() => this.shoppingListService.items().length);
  readonly checkedCount = computed(
    () => this.shoppingListService.items().filter((i) => i.checked).length,
  );
  readonly uncheckedCount = computed(
    () => this.shoppingListService.items().filter((i) => !i.checked).length,
  );
  readonly boughtProgress = computed(() => {
    const total = this.totalCount();
    return total ? Math.round((this.checkedCount() / total) * 100) : 0;
  });
  readonly hasActiveFilters = computed(() => !!this.searchQuery() || this.activeFilter() !== 'all');

  // Price & Budget Calculations
  readonly totalEstimatedCost = computed(() => {
    return this.shoppingListService
      .items()
      .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  });

  readonly inCartCost = computed(() => {
    return this.shoppingListService
      .items()
      .filter((i) => i.checked)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  });

  readonly remainingCost = computed(() => {
    return this.shoppingListService
      .items()
      .filter((i) => !i.checked)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  });

  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allVisibleSelected = computed(() => {
    const visible = this.filteredItems();
    return visible.length > 0 && visible.every((item) => this.selectedIds().has(item.id));
  });
  readonly someVisibleSelected = computed(() => {
    const visible = this.filteredItems();
    const count = visible.filter((item) => this.selectedIds().has(item.id)).length;
    return count > 0 && count < visible.length;
  });

  goToAddItemPage(): void {
    this.router.navigate(['/shopping-list/new']);
  }

  goToStoreManagement(): void {
    this.router.navigate(['/shopping-list/stores']);
  }

  updateItemPrice(item: ShoppingItem, priceStr: string): void {
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price >= 0) {
      this.shoppingListService.updateItemPrice(item.id, price);
    }
  }

  updateInlineQuantity(item: ShoppingItem, quantity: number | null): void {
    if (quantity !== null && quantity > 0 && quantity !== item.quantity) {
      this.shoppingListService.updateItemQuantity(item.id, quantity);
    }
  }

  updateInlinePrice(item: ShoppingItem, price: number | null): void {
    if (price !== null && price >= 0 && price !== item.estimatedPrice) {
      this.shoppingListService.updateItemPrice(item.id, price);
    }
  }

  autoFillFromMealPlanner(): void {
    this.mealPlannerService.addAllMissingToShoppingList();
  }

  toggleItem(id: string): void {
    this.shoppingListService.toggleItem(id);
  }

  openItem(id: string): void {
    this.router.navigate(['/shopping-list', id, 'edit']);
  }

  toggleSelection(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  toggleSelectAll(): void {
    const next = new Set(this.selectedIds());
    if (this.allVisibleSelected()) this.filteredItems().forEach((item) => next.delete(item.id));
    else this.filteredItems().forEach((item) => next.add(item.id));
    this.selectedIds.set(next);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set<string>());
  }

  markSelectedBought(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.shoppingListService.markBought(ids).subscribe(() => {
      this.shoppingListService.loadItemsFromBackend();
      this.selectedIds.set(new Set());
    });
  }

  deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length || !window.confirm(`Delete ${ids.length} selected item(s)?`)) return;
    this.shoppingListService.deleteItems(ids).subscribe(() => {
      this.shoppingListService.loadItemsFromBackend();
      this.selectedIds.set(new Set());
    });
  }

  removeItem(id: string): void {
    this.shoppingListService.removeItem(id);
  }

  clearChecked(): void {
    this.shoppingListService.clearChecked();
  }

  restockChecked(): void {
    this.router.navigate(['/shopping-list/restock']);
  }

  goToRestock(): void {
    this.router.navigate(['/shopping-list/restock']);
  }

  restockSelected(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.router.navigate(['/shopping-list/restock'], { queryParams: { ids: ids.join(',') } });
  }

  setFilter(filter: 'all' | 'unchecked' | 'checked'): void {
    this.activeFilter.set(filter);
    this.selectedIds.set(new Set());
  }

  setSearch(query: string): void {
    this.searchQuery.set(query);
    this.selectedIds.set(new Set());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.setFilter('all');
  }
}
