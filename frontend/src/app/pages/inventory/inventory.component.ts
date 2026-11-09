import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  effect,
  inject,
  NgZone,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientGroup as IngredientGroupModel } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { IngredientCategoryCluster, IngredientGroupCluster } from '@models/inventory.models';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import {
  fadeInOut,
  STAGGER_DELAY_PER_ITEM_MS,
  staggeredFadeIn,
} from '@utility/animationUtility/animations';
import {
  isExpired,
  isExpiringSoon,
  isOutOfStock,
  sortItemsByExpirationDate,
} from '@utility/itemUtility/ItemUtility';
import { AuthService } from '../../core/services/auth.service';

import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { AddItemFormComponent } from './inventory-components/add-item-form/add-item-form.component';

import { ActivatedRoute, Router } from '@angular/router';

export type StatusFilter = 'all' | 'expiring' | 'expired' | 'fresh' | 'out_of_stock';
export type SortOption = 'expiration' | 'name' | 'quantity' | 'purchase' | 'status';

import {
  AlertComponent,
  BadgeComponent,
  ConfirmDialogService,
  DataTablePaginationComponent,
  EmptyStateComponent,
  FormFieldComponent,
  SearchInputComponent,
  SegmentedControlComponent,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';

@Component({
  selector: 'pantry-inventory',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxModule,
    TranslocoModule,
    AddItemFormComponent,
    ToastModule,
    FormsModule,
    SelectModule,
    DialogModule,
    DatePickerModule,
    InputTextModule,
    SearchInputComponent,
    SegmentedControlComponent,
    BadgeComponent,
    AlertComponent,
    SkeletonComponent,
    SpinnerComponent,
    EmptyStateComponent,
    FormFieldComponent,
    DataTablePaginationComponent,
  ],
  templateUrl: './inventory.component.html',
  animations: [fadeInOut, staggeredFadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.initParameters();
      }
    });
  }

  readonly staggerDelayPerItemMs = STAGGER_DELAY_PER_ITEM_MS;

  public totalItemsCount = 0;
  public expiringSoonItemsCount = 0;
  public expiredItemsCount = 0;
  public freshItemsCount = 0;
  public outOfStockItemsCount = 0;

  public selectedItemIds = signal<Set<string>>(new Set<string>());

  public items: Item[] = [];
  public units: Unit[] = [];
  public locations: Location[] = [];
  public ingredients: Ingredient[] = [];
  public categories: IngredientGroupModel[] = [];
  public nutrientTypes: IngredientCategory[] = [];

  public showScrollTopButton = false;
  public searchQuery = '';
  public selectedLocationId: number | null = null;
  public selectedStatusFilter: StatusFilter = 'all';
  public sortBy: SortOption = 'expiration';
  public displayAddModal = false;

  public selectedCategory: IngredientGroupModel | null = null;
  public isLoading = signal(true);
  public loadFailed = signal(false);

  // Quick Restock Modal Dialog State
  public displayRestockModal = signal(false);
  public restockItem = signal<Item | null>(null);
  public restockItems = signal<Item[]>([]);
  public restockAmount = signal<number>(1);
  public restockLocationId = signal<number | null>(null);
  // Holds the exact Date the picker emitted so NgModel never sees a recomputed object mid-typing.
  public restockExpirationDate = signal<Date | null>(null);
  public isRestocking = signal(false);

  public sortDirection: 'asc' | 'desc' = 'asc';

  private filteredItemsCache: Item[] | null = null;
  private filteredItemsCacheKey = '';
  private filteredItemsCacheSource: Item[] | null = null;

  // Pagination State
  public currentPage = 1;
  public pageSize = 15;

  public getIngredientName(ingredientId?: string): string | null {
    if (!ingredientId) return null;
    const ing = this.ingredients.find((i) => i.id === ingredientId);
    return ing ? ing.name : null;
  }

  public ariaSort(field: SortOption): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  public toggleSort(field: SortOption): void {
    this.resetPagination(); // Reset pagination on sort change
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
  }

  public get filteredItems(): Item[] {
    const cacheKey = [
      this.searchQuery,
      this.selectedLocationId ?? '',
      this.selectedStatusFilter,
      this.sortBy,
      this.sortDirection,
    ].join('|');
    if (this.filteredItemsCacheSource === this.items && this.filteredItemsCacheKey === cacheKey) {
      return this.filteredItemsCache || [];
    }

    const filtered = this.items
      .filter((item) => {
        // 1. Text Search
        const matchesSearch =
          !this.searchQuery ||
          item.name.toLowerCase().includes(this.searchQuery.toLowerCase().trim());

        // 2. Location Filter
        const matchesLocation =
          this.selectedLocationId === null || item.location?.id === this.selectedLocationId;

        // 3. Status Filter
        let matchesStatus = true;
        if (this.selectedStatusFilter === 'expiring') {
          matchesStatus = isExpiringSoon(item) && !isOutOfStock(item);
        } else if (this.selectedStatusFilter === 'expired') {
          matchesStatus = isExpired(item) && !isOutOfStock(item);
        } else if (this.selectedStatusFilter === 'fresh') {
          matchesStatus = !isExpired(item) && !isExpiringSoon(item) && !isOutOfStock(item);
        } else if (this.selectedStatusFilter === 'out_of_stock') {
          matchesStatus = isOutOfStock(item);
        }

        return matchesSearch && matchesLocation && matchesStatus;
      })
      .sort((a, b) => {
        const aOutOfStock = isOutOfStock(a);
        const bOutOfStock = isOutOfStock(b);

        // Out of stock items always sort to the bottom of the table
        if (aOutOfStock !== bOutOfStock) {
          return aOutOfStock ? 1 : -1;
        }

        let result = 0;
        if (this.sortBy === 'expiration') {
          const hasExpA = a.expirationDate !== undefined && a.expirationDate !== null;
          const hasExpB = b.expirationDate !== undefined && b.expirationDate !== null;

          if (hasExpA !== hasExpB) {
            return hasExpA ? -1 : 1;
          }

          const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
          const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
          result = dateA - dateB;
        } else if (this.sortBy === 'name') {
          result = a.name.localeCompare(b.name);
        } else if (this.sortBy === 'quantity') {
          result = b.quantity - a.quantity;
        } else if (this.sortBy === 'purchase') {
          const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
          const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
          result = dateB - dateA;
        } else if (this.sortBy === 'status') {
          const getStatusRank = (item: Item) => {
            if (isOutOfStock(item)) return 4;
            if (isExpired(item)) return 3;
            if (isExpiringSoon(item)) return 2;
            return 1;
          };
          result = getStatusRank(a) - getStatusRank(b);
        }
        return this.sortDirection === 'asc' ? result : -result;
      });
    this.filteredItemsCacheSource = this.items;
    this.filteredItemsCacheKey = cacheKey;
    this.filteredItemsCache = filtered;
    return filtered;
  }

  public get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  public get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredItems.length);
  }

  public get displayedItems(): Item[] {
    return this.filteredItems.slice(this.startIndex, this.endIndex);
  }

  public onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  public onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  public get locationSelectOptions(): { id: number | null; name: string }[] {
    return [
      { id: null, name: this.transloco.translate('inventoryTable.allLocations') },
      ...this.locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
      })),
    ];
  }

  public resetPagination(): void {
    this.currentPage = 1;
  }

  public get bulkRestockLocationOptions(): { id: number; name: string }[] {
    return [
      { id: 0, name: this.transloco.translate('inventoryTable.keepLocation') },
      ...this.locations.map((loc) => ({
        id: loc.id,
        name: this.transloco.translate('inventoryTable.moveAllTo', { name: loc.name }),
      })),
    ];
  }

  setStatusFilter(status: StatusFilter): void {
    this.resetPagination();
    if (this.selectedStatusFilter === status && status !== 'all') {
      this.selectedStatusFilter = 'all'; // Toggle back off
    } else {
      this.selectedStatusFilter = status;
    }
  }

  // Ingredient Groups stats
  public get inStockIngredientsCount(): number {
    return this.ingredients.filter((ing) => this.items.some((item) => item.ingredientId === ing.id))
      .length;
  }

  public get outOfStockIngredientsCount(): number {
    return this.ingredients.filter(
      (ing) => !this.items.some((item) => item.ingredientId === ing.id),
    ).length;
  }

  public get categoryGroups() {
    const ingredientMap = new Map();

    this.ingredients.forEach((ingredient) => {
      const ingredientItems = this.items.filter((item) => item.ingredientId === ingredient.id);
      ingredientMap.set(ingredient.id, {
        ...ingredient,
        items: ingredientItems,
        itemCount: ingredientItems.length,
      });
    });

    const categoryMap = new Map();

    ingredientMap.forEach((ingredient) => {
      const categoryId = ingredient.category?.id ?? -1;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, []);
      }
      categoryMap.get(categoryId).push(ingredient);
    });

    const groups: IngredientGroupCluster[] = [];
    const normalizedQuery = this.searchQuery.toLowerCase().trim();

    categoryMap.forEach((ingredients, categoryId) => {
      const category =
        categoryId === -1
          ? { id: -1, name: 'Uncategorized' }
          : (this.categories.find((c) => c.id === categoryId) ?? { id: -1, name: 'Unknown' });

      if (this.selectedCategory && this.selectedCategory.id !== category.id) {
        return;
      }

      const filteredIngredients = ingredients.filter((ing: Ingredient) =>
        ing.name.toLowerCase().includes(normalizedQuery),
      );

      if (filteredIngredients.length > 0) {
        groups.push({ group: category, category, ingredients: filteredIngredients });
      }
    });

    return groups.sort((a, b) =>
      (a.group || a.category!).name.localeCompare((b.group || b.category!).name),
    );
  }

  public get nutrientGroups(): IngredientCategoryCluster[] {
    const catGroupsMap = new Map<number, IngredientGroupCluster>();
    this.categoryGroups.forEach((cg) => {
      catGroupsMap.set((cg.group || cg.category!).id, cg);
    });

    const result: IngredientCategoryCluster[] = [];
    const normalizedQuery = this.searchQuery.toLowerCase().trim();
    const hasSearchOrCategoryFilter = normalizedQuery.length > 0 || this.selectedCategory !== null;

    // 1. Group categories by ingredientCategoryId using all fetched nutrientTypes
    this.nutrientTypes.forEach((nt) => {
      const categoriesForNt = this.categories.filter((c) => c.ingredientCategoryId === nt.id);
      const categoryGroupsInNt: IngredientGroupCluster[] = [];

      categoriesForNt.forEach((cat) => {
        if (this.selectedCategory && this.selectedCategory.id !== cat.id) {
          return;
        }
        const existingGroup = catGroupsMap.get(cat.id);
        if (existingGroup) {
          categoryGroupsInNt.push(existingGroup);
        } else if (!hasSearchOrCategoryFilter) {
          // Include category even if 0 ingredients/items when no filter active
          categoryGroupsInNt.push({ group: cat, category: cat, ingredients: [] });
        }
      });

      // Show category if no filter active OR if it has matching category groups
      if (!hasSearchOrCategoryFilter || categoryGroupsInNt.length > 0) {
        result.push({
          category: nt,
          ingredientGroups: categoryGroupsInNt,
          categoryGroups: categoryGroupsInNt.sort((a, b) =>
            (a.group || a.category!).name.localeCompare((b.group || b.category!).name),
          ),
        });
      }
    });

    // Also handle any uncategorized categories
    const knownCatIds = new Set(this.categories.map((c) => c.id));
    const uncategorizedCatGroups = this.categoryGroups.filter(
      (cg) =>
        !knownCatIds.has((cg.group || cg.category!).id) ||
        !this.categories.find((c) => c.id === (cg.group || cg.category!).id)?.ingredientCategoryId,
    );

    if (uncategorizedCatGroups.length > 0) {
      result.push({
        category: {
          id: -1,
          name: this.transloco.translate('inventory.taxonomy.unclassified'),
          icon: '📦',
          color: '#94a3b8',
          description: this.transloco.translate('inventory.taxonomy.unclassifiedDescription'),
        },
        ingredientGroups: uncategorizedCatGroups,
        categoryGroups: uncategorizedCatGroups,
      });
    }

    return result.sort((a, b) => {
      const catA = a.category;
      const catB = b.category;
      if (catA.id === -1) return 1;
      if (catB.id === -1) return -1;
      return catA.name.localeCompare(catB.name);
    });
  }

  public expandedIngredients = new Set<string>();
  public expandedCategories = new Set<number>();
  public loading = false;

  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['status']) {
        this.selectedStatusFilter = params['status'] as StatusFilter;
      }
    });

    this.ngZone.runOutsideAngular(() => {
      const scrollHandler = () => {
        const shouldShow = window.scrollY > 300;
        if (this.showScrollTopButton !== shouldShow) {
          this.showScrollTopButton = shouldShow;
          this.cdr.markForCheck();
        }
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', scrollHandler);
      });
    });
  }

  public retryLoad(): void {
    this.initParameters();
  }

  private initParameters(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.inventoryService.getItems().subscribe({
      next: (items) => {
        this.items = sortItemsByExpirationDate(items);
        this.totalItemsCount = this.items.length;
        this.expiringSoonItemsCount = this.items.filter(
          (item) => isExpiringSoon(item) && item.quantity > 0,
        ).length;
        this.expiredItemsCount = this.items.filter(
          (item) => isExpired(item) && item.quantity > 0,
        ).length;
        this.outOfStockItemsCount = this.items.filter((item) => isOutOfStock(item)).length;
        this.freshItemsCount = this.items.filter(
          (item) => !isExpired(item) && !isExpiringSoon(item) && item.quantity > 0,
        ).length;

        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.loadFailed.set(true);
        this.cdr.markForCheck();
        this.toastService.showError(
          this.transloco.translate('inventory.messages.loadError'),
          this.transloco.translate('inventory.messages.loadErrorTitle'),
        );
      },
    });

    this.unitService.getUnits().subscribe({
      next: (units) => (this.units = units),
    });

    this.locationService.getLocations().subscribe({
      next: (locations) => (this.locations = locations),
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => {
        this.ingredients = ingredients;
        this.cdr.markForCheck();
      },
    });

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (categories) => (this.categories = categories),
    });

    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (nutrientTypes) => {
        this.nutrientTypes = nutrientTypes;
        this.cdr.markForCheck();
      },
    });
  }

  private readonly router = inject(Router);

  public openAddModal(): void {
    this.router.navigate(['/inventory/new']);
  }

  public onAddItem(item: Item): void {
    this.inventoryService.addItem(item).subscribe({
      next: () => {
        this.displayAddModal = false;
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.itemAdded', { name: item.name }),
          this.transloco.translate('inventory.messages.itemAddedTitle'),
        );
        this.initParameters();
      },
      error: (err) => {
        this.toastService.showError(
          err?.message || this.transloco.translate('inventory.messages.addFailed'),
          this.transloco.translate('inventory.messages.errorTitle'),
        );
      },
    });
  }

  public async onDeleteItem(item: Item, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('inventory.messages.removeTitle'),
      message: this.transloco.translate('inventory.messages.removeConfirm', { name: item.name }),
      acceptLabel: this.transloco.translate('inventory.messages.removeTitle'),
      destructive: true,
    });
    if (!confirmed) return;

    this.inventoryService.removeItem(item).subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.removed', { name: item.name }),
          this.transloco.translate('inventory.messages.removedTitle'),
        );
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(
          this.transloco.translate('inventory.messages.removeFailed', { name: item.name }),
          this.transloco.translate('inventory.messages.errorTitle'),
        );
      },
    });
  }

  public onEditItem(item: Item): void {
    this.router.navigate(['/inventory', item.id, 'edit']);
  }

  public isExpiredItem(item: Item): boolean {
    return isExpired(item);
  }

  public isExpiringSoonItem(item: Item): boolean {
    return isExpiringSoon(item);
  }

  public isOutOfStockItem(item: Item): boolean {
    return isOutOfStock(item);
  }

  public onUpdateItem(updatedItem: Item): void {
    this.inventoryService.updateItem(updatedItem).subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.updated', { name: updatedItem.name }),
          this.transloco.translate('inventory.messages.updatedTitle'),
        );
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(
          this.transloco.translate('inventory.messages.updateFailed', { name: updatedItem.name }),
          this.transloco.translate('inventory.messages.errorTitle'),
        );
      },
    });
  }

  // Selection Methods
  public toggleSelectItem(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const current = new Set(this.selectedItemIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedItemIds.set(current);
  }

  public toggleSelectAllVisible(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const current = new Set(this.selectedItemIds());
    const visibleIds = this.displayedItems.map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id));

    if (allSelected) {
      visibleIds.forEach((id) => current.delete(id));
    } else {
      visibleIds.forEach((id) => current.add(id));
    }
    this.selectedItemIds.set(current);
  }

  public isAllVisibleSelected(): boolean {
    if (this.displayedItems.length === 0) return false;
    const current = this.selectedItemIds();
    return this.displayedItems.every((item) => current.has(item.id));
  }

  public isItemSelected(id: string): boolean {
    return this.selectedItemIds().has(id);
  }

  public clearSelection(): void {
    this.selectedItemIds.set(new Set<string>());
  }

  // Stock Action Handlers
  public async onClearStockItem(item: Item, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('inventory.messages.clearTitle'),
      message: this.transloco.translate('inventory.messages.clearConfirm', { name: item.name }),
      acceptLabel: this.transloco.translate('inventory.messages.clearTitle'),
      icon: 'pi pi-box',
    });
    if (!confirmed) return;

    const updatedItem = { ...item, quantity: 0, expirationDate: undefined };

    this.inventoryService.updateItem(updatedItem).subscribe({
      next: () => {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.cleared', { name: item.name }),
          this.transloco.translate('inventory.messages.clearedTitle'),
        );
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(
          this.transloco.translate('inventory.messages.clearFailed', { name: item.name }),
          this.transloco.translate('inventory.messages.errorTitle'),
        );
      },
    });
  }

  public openRestockDialog(item: Item, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.restockItem.set(item);
    this.restockItems.set([item]);
    this.restockAmount.set(1);
    this.restockLocationId.set(item.location.id);
    this.restockExpirationDate.set(this.toLocalDate(item.expirationDate));
    this.displayRestockModal.set(true);
  }

  public onQuickRestockItem(item: Item, event?: Event): void {
    this.openRestockDialog(item, event);
  }

  public setRestockExpiryDays(days: number): void {
    const today = new Date();
    this.restockExpirationDate.set(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + days),
    );
  }

  public clearRestockExpiry(): void {
    this.restockExpirationDate.set(null);
  }

  public onRestockExpirationChange(date: Date | null): void {
    this.restockExpirationDate.set(date);
  }

  // Local-midnight calendar date. Never goes through UTC (toISOString) so it cannot shift a day.
  private toLocalDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    if (typeof value === 'string') {
      const calendar = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (calendar) {
        return new Date(Number(calendar[1]), Number(calendar[2]) - 1, Number(calendar[3]));
      }
      value = new Date(value);
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private toLocalIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  public onConfirmRestock(): void {
    const items =
      this.restockItems().length > 0
        ? this.restockItems()
        : this.restockItem()
          ? [this.restockItem()!]
          : [];

    if (items.length === 0) return;

    const amount = Number(this.restockAmount());
    if (isNaN(amount) || amount <= 0) {
      this.toastService.showError(
        this.transloco.translate('inventory.messages.invalidQuantity'),
        this.transloco.translate('inventory.messages.validationTitle'),
      );
      return;
    }

    const locId = Number(this.restockLocationId() || 0);
    const selectedLocation = locId > 0 ? this.locations.find((l) => l.id === locId) : undefined;

    let expDate: Date | undefined = undefined;
    const pickedDate = this.restockExpirationDate();
    if (pickedDate) {
      expDate = new Date(this.toLocalIsoDate(pickedDate) + 'T00:00:00');
    }

    this.isRestocking.set(true);
    let completed = 0;
    let failed = 0;

    items.forEach((item) => {
      const currentQty = item.quantity > 0 ? Number(item.quantity) : 0;
      const updatedItem: Item = {
        ...item,
        quantity: currentQty + amount,
        purchaseDate: new Date(), // Always update purchase date on restock!
        location: selectedLocation || item.location,
        expirationDate: expDate ? expDate : item.expirationDate,
      };

      this.inventoryService.updateItem(updatedItem).subscribe({
        next: () => {
          completed++;
          if (completed + failed === items.length) {
            this.finishRestock(completed, failed, amount, items);
          }
        },
        error: (err) => {
          failed++;
          console.error('Restock error for item', item.id, err);
          if (completed + failed === items.length) {
            this.finishRestock(completed, failed, amount, items);
          }
        },
      });
    });
  }

  private finishRestock(completed: number, failed: number, amount: number, items: Item[]): void {
    this.isRestocking.set(false);
    this.displayRestockModal.set(false);

    if (completed > 0) {
      if (items.length === 1) {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.restockedOne', {
            name: items[0].name,
            amount,
            unit: items[0].unit.shortName || items[0].unit.name,
          }),
          this.transloco.translate('inventory.messages.restockedOneTitle'),
        );
      } else {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.restockedMany', { count: completed }),
          this.transloco.translate('inventory.messages.bulkCompleteTitle'),
        );
      }
      this.clearSelection();
      this.initParameters();
    }
    if (failed > 0) {
      this.toastService.showError(
        this.transloco.translate('inventory.messages.restockFailed', { count: failed }),
        this.transloco.translate('inventory.messages.errorTitle'),
      );
    }
  }

  public onAddToShoppingList(item: Item, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.shoppingListService.addItem({
      ingredientId: item.ingredientId,
      name: item.name,
      category: 'Pantry Restock',
      quantity: 1,
      unit: item.unit.shortName,
      source: 'low_stock',
    });
  }

  // Bulk Action Handlers
  public async onBulkClearStock(): Promise<void> {
    const ids = Array.from(this.selectedItemIds());
    if (ids.length === 0) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('inventory.messages.bulkClearTitle'),
      message: this.transloco.translate('inventory.messages.bulkClearConfirm', {
        count: ids.length,
      }),
      acceptLabel: this.transloco.translate('inventory.messages.clearTitle'),
      icon: 'pi pi-box',
    });
    if (!confirmed) return;

    this.inventoryService.bulkClearStock(ids).subscribe({
      next: (res) => {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.bulkCleared', {
            count: res.clearedCount,
          }),
          this.transloco.translate('inventory.messages.bulkCompleteTitle'),
        );
        this.clearSelection();
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(
          this.transloco.translate('inventory.messages.bulkClearFailed'),
          this.transloco.translate('inventory.messages.errorTitle'),
        );
      },
    });
  }

  public onBulkAddToShoppingList(): void {
    const ids = Array.from(this.selectedItemIds());
    if (ids.length === 0) return;

    const selectedItems = this.items.filter((item) => ids.includes(item.id));
    const dtos = selectedItems.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.name,
      category: 'Pantry Restock',
      quantity: 1,
      unit: item.unit.shortName,
      source: 'low_stock' as const,
    }));

    this.shoppingListService.addMultipleItems(dtos);
    this.clearSelection();
  }

  public onBulkRestock(): void {
    const ids = Array.from(this.selectedItemIds());
    if (ids.length === 0) return;

    const selectedItems = this.items.filter((item) => ids.includes(item.id));
    this.restockItems.set(selectedItems);
    this.restockAmount.set(1);
    this.restockExpirationDate.set(null);

    if (selectedItems.length === 1) {
      const singleItem = selectedItems[0];
      this.restockItem.set(singleItem);
      this.restockLocationId.set(singleItem.location.id);
      this.restockExpirationDate.set(this.toLocalDate(singleItem.expirationDate));
    } else {
      this.restockItem.set(null);
      this.restockLocationId.set(0);
    }

    this.displayRestockModal.set(true);
  }

  public async onBulkDelete(): Promise<void> {
    const ids = Array.from(this.selectedItemIds());
    if (ids.length === 0) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('inventory.messages.bulkDeleteTitle'),
      message: this.transloco.translate('inventory.messages.bulkDeleteConfirm', {
        count: ids.length,
      }),
      acceptLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    this.inventoryService.bulkDeleteItems(ids).subscribe({
      next: (res) => {
        this.toastService.showSuccess(
          this.transloco.translate('inventory.messages.bulkDeleted', {
            count: res.deletedCount,
          }),
          this.transloco.translate('inventory.messages.itemsDeletedTitle'),
        );
        this.clearSelection();
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(
          this.transloco.translate('inventory.messages.bulkDeleteFailed'),
          this.transloco.translate('inventory.messages.errorTitle'),
        );
      },
    });
  }
}
