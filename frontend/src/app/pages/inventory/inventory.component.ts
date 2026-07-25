import { CommonModule } from "@angular/common";
import { Component, HostListener, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StatCardComponent } from "@components/stat-card/stat-card.component";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { Category } from "@models/category.model";
import { Ingredient } from "@models/ingredient.model";
import { EnrichedIngredient, IngredientGroup } from "@models/inventory.models";
import { Item } from "@models/items.model";
import { Location } from "@models/location.model";
import { Unit } from "@models/unit.model";
import { CategoryService } from "@services/inventory/category.service";
import { IngredientService } from "@services/inventory/ingredient.service";
import { ItemService } from "@services/inventory/item.service";
import { LocationService } from "@services/inventory/location.service";
import { UnitService } from "@services/inventory/unit.service";
import { ToastService } from "@services/toast.service";
import {
  fadeInOut,
  STAGGER_DELAY_PER_ITEM_MS,
  staggeredFadeIn,
} from "@utility/animationUtility/animations";
import {
  isExpired,
  isExpiringSoon,
  sortItemsByExpirationDate,
} from "@utility/itemUtility/ItemUtility";
import { ConfirmationService } from "primeng/api";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { AddItemFormComponent } from "./inventory-components/add-item-form/add-item-form.component";
import { IngredientGroupContainerComponent } from "./inventory-components/ingredient-group-container/ingredient-group-container.component";
import { ItemCardComponent } from "./inventory-components/item-card/item-card.component";
import {
  InventoryTab,
  TabNavigationComponent,
} from "./inventory-components/tab-navigation/tab-navigation.component";
import { UnassignedItemsContainerComponent } from "./inventory-components/unassigned-items-container/unassigned-items-container.component";

import { Router, RouterLink } from "@angular/router";

export type StatusFilter = 'all' | 'expiring' | 'expired' | 'fresh';
export type SortOption = 'expiration' | 'name' | 'quantity' | 'purchase';

@Component({
  selector: "pantry-inventory",
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    AddItemFormComponent,
    ItemCardComponent,
    StatCardComponent,
    ConfirmDialogModule,
    ToastModule,
    FormsModule,
    TabNavigationComponent,
    SelectModule,
    DialogModule,
    IngredientGroupContainerComponent,
    UnassignedItemsContainerComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: "./inventory.component.html",
  animations: [fadeInOut, staggeredFadeIn],
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly categoryService = inject(CategoryService);
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
  public categories: Category[] = [];

  public showScrollTopButton = false;
  public searchQuery = "";
  public selectedLocationId: number | null = null;
  public selectedStatusFilter: StatusFilter = "all";
  public sortBy: SortOption = "expiration";
  public displayAddModal = false;

  public selectedCategory: Category | null = null;
  public isLoading = signal(true);
  public activeTab: InventoryTab = "items";

  public viewMode: 'table' | 'grid' = 'table';
  public sortDirection: 'asc' | 'desc' = 'asc';

  public displayLimit = 15;
  public readonly batchSize = 15;

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
        const matchesSearch = !this.searchQuery || item.name.toLowerCase().includes(this.searchQuery.toLowerCase().trim());

        // 2. Location Filter
        const matchesLocation = this.selectedLocationId === null || item.location?.id === this.selectedLocationId;

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
        }
        return this.sortDirection === 'asc' ? result : -result;
      });
  }

  public get displayedItems(): Item[] {
    return this.filteredItems.slice(0, this.displayLimit);
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
    return this.ingredients.filter((ing) =>
      this.items.some((item) => item.ingredientId === ing.id)
    ).length;
  }

  public get outOfStockIngredientsCount(): number {
    return this.ingredients.filter(
      (ing) => !this.items.some((item) => item.ingredientId === ing.id),
    ).length;
  }

  public get unassignedItemsCount(): number {
    return this.items.filter((item) => !item.ingredientId).length;
  }

  public get unassignedItems(): Item[] {
    return this.items.filter((item) => !item.ingredientId);
  }

  public get categoryGroups() {
    const ingredientMap = new Map();

    this.ingredients.forEach((ingredient) => {
      const ingredientItems = this.items.filter(
        (item) => item.ingredientId === ingredient.id,
      );
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

    const groups: IngredientGroup[] = [];
    const normalizedQuery = this.searchQuery.toLowerCase().trim();

    categoryMap.forEach((ingredients, categoryId) => {
      const category = categoryId === -1
        ? { id: -1, name: "Uncategorized" }
        : this.categories.find((c) => c.id === categoryId) ??
          { id: -1, name: "Unknown" };

      if (this.selectedCategory && this.selectedCategory.id !== category.id) {
        return;
      }

      const filteredIngredients = ingredients.filter((ing: any) =>
        ing.name.toLowerCase().includes(normalizedQuery)
      );

      if (filteredIngredients.length > 0) {
        groups.push({ category, ingredients: filteredIngredients });
      }
    });

    return groups.sort((a, b) =>
      a.category.name.localeCompare(b.category.name)
    );
  }

  public expandedIngredients = new Set<string>();
  public expandedCategories = new Set<number>();
  public loading = false;

  public onAssignItem(
    event: { item: Item; ingredient: EnrichedIngredient },
  ): void {
    console.log("Assigning item:", event.item.name, "to ingredient:", event.ingredient.name);
  }

  @HostListener("window:scroll", [])
  onWindowScroll(): void {
    this.showScrollTopButton = window.scrollY > 300;

    if (this.activeTab === 'items' && this.displayLimit < this.filteredItems.length) {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 400;
      if (scrollPosition >= threshold) {
        this.loadMoreItems();
      }
    }
  }

  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  ngOnInit(): void {
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
        this.freshItemsCount = this.totalItemsCount - this.expiringSoonItemsCount - this.expiredItemsCount;

        setTimeout(() => {
          this.isLoading.set(false);
        }, 50);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.showError("Unable to load inventory items.", "Network Error");
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

    this.categoryService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
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
        this.toastService.showSuccess(`"${item.name}" added to inventory!`, "Item Added");
        this.initParameters();
      },
      error: (err) => {
        this.toastService.showError(err?.message || "Failed to add item.", "Error");
      },
    });
  }

  public onDeleteItem(item: Item, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.confirmationService.confirm({
      header: "Remove Item",
      message: `Are you sure you want to remove "${item.name}" from inventory?`,
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.inventoryService.removeItem(item).subscribe({
          next: () => {
            this.toastService.showSuccess(`"${item.name}" removed from inventory.`, "Item Removed");
            this.initParameters();
          },
          error: () => {
            this.toastService.showError(`Failed to remove "${item.name}".`, "Error");
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
        this.toastService.showSuccess(`Updated "${updatedItem.name}".`, "Item Updated");
        this.initParameters();
      },
      error: () => {
        this.toastService.showError(`Failed to update "${updatedItem.name}".`, "Error");
      },
    });
  }

  public onTabChange(tab: InventoryTab): void {
    this.activeTab = tab;
  }
}
