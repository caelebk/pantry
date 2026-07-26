import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
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
import { ToastService } from '@services/toast.service';
import {
  fadeInOut,
  STAGGER_DELAY_PER_ITEM_MS,
  staggeredFadeIn,
} from '@utility/animationUtility/animations';
import {
  isExpired,
  isExpiringSoon,
  sortItemsByExpirationDate,
} from '@utility/itemUtility/ItemUtility';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { AddItemFormComponent } from './inventory-components/add-item-form/add-item-form.component';

import { ActivatedRoute, Router } from '@angular/router';
import { ItemCardComponent } from './inventory-components/item-card/item-card.component';

export type StatusFilter = 'all' | 'expiring' | 'expired' | 'fresh';
export type SortOption = 'expiration' | 'name' | 'quantity' | 'purchase' | 'status';

@Component({
  selector: 'pantry-inventory',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    AddItemFormComponent,
    ItemCardComponent,
    ConfirmDialogModule,
    ToastModule,
    FormsModule,
    SelectModule,
    DialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './inventory.component.html',
  animations: [fadeInOut, staggeredFadeIn],
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastService = inject(ToastService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);

  readonly staggerDelayPerItemMs = STAGGER_DELAY_PER_ITEM_MS;

  public readonly dismissableMask = true;

  public totalItemsCount = 0;
  public expiringSoonItemsCount = 0;
  public expiredItemsCount = 0;
  public freshItemsCount = 0;

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

  public viewMode: 'table' | 'grid' = 'table';
  public sortDirection: 'asc' | 'desc' = 'asc';

  public displayLimit = 15;
  public readonly batchSize = 15;

  public getIngredientName(ingredientId?: string): string | null {
    if (!ingredientId) return null;
    const ing = this.ingredients.find((i) => i.id === ingredientId);
    return ing ? ing.name : null;
  }

  public toggleSort(field: SortOption): void {
    this.displayLimit = this.batchSize; // Reset pagination on sort change
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
  }

  public get filteredItems(): Item[] {
    return this.items
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
          matchesStatus = isExpiringSoon(item);
        } else if (this.selectedStatusFilter === 'expired') {
          matchesStatus = isExpired(item);
        } else if (this.selectedStatusFilter === 'fresh') {
          matchesStatus = !isExpired(item) && !isExpiringSoon(item);
        }

        return matchesSearch && matchesLocation && matchesStatus;
      })
      .sort((a, b) => {
        let result = 0;
        if (this.sortBy === 'expiration') {
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
          // Status order score: Fresh (1), Expiring (2), Expired (3)
          const getStatusRank = (item: Item) => {
            if (isExpired(item)) return 3;
            if (isExpiringSoon(item)) return 2;
            return 1;
          };
          result = getStatusRank(a) - getStatusRank(b);
        }
        return this.sortDirection === 'asc' ? result : -result;
      });
  }

  public get displayedItems(): Item[] {
    return this.filteredItems.slice(0, this.displayLimit);
  }

  public get locationSelectOptions(): { id: number | null; name: string; icon: string }[] {
    return [
      { id: null, name: 'All Locations', icon: '📍' },
      ...this.locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        icon: loc.name === 'Fridge' ? '❄️' : loc.name === 'Freezer' ? '🧊' : '🥫',
      })),
    ];
  }

  public loadMoreItems(): void {
    if (this.displayLimit < this.filteredItems.length) {
      this.displayLimit += this.batchSize;
    }
  }

  public resetPagination(): void {
    this.displayLimit = this.batchSize;
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

      const filteredIngredients = ingredients.filter((ing: any) =>
        ing.name.toLowerCase().includes(normalizedQuery),
      );

      if (filteredIngredients.length > 0) {
        groups.push({ group: category, category, ingredients: filteredIngredients });
      }
    });

    return groups.sort((a, b) => (a.group || a.category!).name.localeCompare((b.group || b.category!).name));
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
      const categoriesForNt = this.categories.filter(
        (c) => (c.ingredientCategoryId ?? c.nutrientGroupId) === nt.id,
      );
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
          nutrientType: nt,
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
          name: 'Unclassified',
          icon: '📦',
          color: '#94a3b8',
          description: 'Categories without an assigned ingredient category',
        },
        ingredientGroups: uncategorizedCatGroups,
        categoryGroups: uncategorizedCatGroups,
      });
    }

    return result.sort((a, b) => {
      const catA = a.category || a.nutrientType!;
      const catB = b.category || b.nutrientType!;
      if (catA.id === -1) return 1;
      if (catB.id === -1) return -1;
      return catA.name.localeCompare(catB.name);
    });
  }

  public expandedIngredients = new Set<string>();
  public expandedCategories = new Set<number>();
  public loading = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollTopButton = window.scrollY > 300;

    if (this.displayLimit < this.filteredItems.length) {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 400;
      if (scrollPosition >= threshold) {
        this.loadMoreItems();
      }
    }
  }

  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['status']) {
        this.selectedStatusFilter = params['status'] as StatusFilter;
      }
    });
    this.initParameters();
  }

  private initParameters(): void {
    this.isLoading.set(true);
    this.inventoryService.getItems().subscribe({
      next: (items) => {
        this.items = sortItemsByExpirationDate(items);
        this.totalItemsCount = this.items.length;
        this.expiringSoonItemsCount = this.items.filter((item) => isExpiringSoon(item)).length;
        this.expiredItemsCount = this.items.filter((item) => isExpired(item)).length;
        this.freshItemsCount =
          this.totalItemsCount - this.expiringSoonItemsCount - this.expiredItemsCount;

        setTimeout(() => {
          this.isLoading.set(false);
        }, 50);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.showError('Unable to load inventory items.', 'Network Error');
      },
    });

    this.unitService.getUnits().subscribe({
      next: (units) => (this.units = units),
    });

    this.locationService.getLocations().subscribe({
      next: (locations) => (this.locations = locations),
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => (this.ingredients = ingredients),
    });

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (categories) => (this.categories = categories),
    });

    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (nutrientTypes) => (this.nutrientTypes = nutrientTypes),
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
        this.toastService.showSuccess(`"${item.name}" added to inventory!`, 'Item Added');
        this.initParameters();
      },
      error: (err) => {
        this.toastService.showError(err?.message || 'Failed to add item.', 'Error');
      },
    });
  }

  public onDeleteItem(item: Item, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.confirmationService.confirm({
      header: 'Remove Item',
      message: `Are you sure you want to remove "${item.name}" from inventory?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.inventoryService.removeItem(item).subscribe({
          next: () => {
            this.toastService.showSuccess(`"${item.name}" removed from inventory.`, 'Item Removed');
            this.initParameters();
          },
          error: () => {
            this.toastService.showError(`Failed to remove "${item.name}".`, 'Error');
          },
        });
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

  public onUpdateItem(updatedItem: Item): void {
    this.inventoryService.updateItem(updatedItem).subscribe({
      next: () => {
        this.toastService.showSuccess(`Updated "${updatedItem.name}".`, 'Item Updated');
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(`Failed to update "${updatedItem.name}".`, 'Error');
      },
    });
  }
}
