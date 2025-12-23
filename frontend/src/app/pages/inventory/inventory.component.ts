import { CommonModule } from "@angular/common";
import { Component, HostListener, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { StatCardComponent } from "@components/stat-card/stat-card.component";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { Category } from "@models/category.model";
import { Ingredient } from "@models/ingredient.model";
import { Item } from "@models/items.model";
import { Location } from "@models/location.model";
import { Unit } from "@models/unit.model";
import { CategoryService } from "@services/inventory/category.service";
import { IngredientService } from "@services/inventory/ingredient.service";
import { ItemService } from "@services/inventory/item.service";
import { LocationService } from "@services/inventory/location.service";
import { UnitService } from "@services/inventory/unit.service";
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
import { ConfirmationService, MessageService } from "primeng/api";
import { Button } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { AddItemFormComponent } from "./inventory-components/add-item-form/add-item-form.component";
import { ItemCardComponent } from "./inventory-components/item-card/item-card.component";
import {
  InventoryTab,
  TabNavigationComponent,
} from "./inventory-components/tab-navigation/tab-navigation.component";

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
    Button,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    InputText,
    TabNavigationComponent,
    SelectModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: "./inventory.component.html",
  animations: [fadeInOut, staggeredFadeIn],
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);

  // Make stagger delay accessible to template
  readonly staggerDelayPerItemMs = STAGGER_DELAY_PER_ITEM_MS;

  private readonly removeConfirmationServiceIcon = "pi pi-exclamation-triangle";
  private readonly successNotificationClass = "success";
  private readonly errorNotificationClass = "error";
  private readonly scrollThreshold = 300;
  private readonly scrollLocation = 0;
  private readonly loadingDelayMs = 50;

  public readonly dismissableMask = true;
  public readonly outlinedCancelButton = true;

  public totalItemsCount = 0;
  public expiringSoonItemsCount = 0;
  public expiredItemsCount = 0;
  public items: Item[] = [];
  public units: Unit[] = [];
  public locations: Location[] = [];
  public ingredients: Ingredient[] = [];
  public categories: Category[] = [];

  public showScrollTopButton = false;
  public searchQuery = "";
  public selectedCategory: Category | null = null;
  public isLoading = signal(true);
  public activeTab: InventoryTab = "items";

  public get filteredItems(): Item[] {
    return this.items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(
        this.searchQuery.toLowerCase(),
      );
      return matchesSearch;
    });
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
    // Create a map of ingredients with their items
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

    // Group by category
    const categoryMap = new Map();

    ingredientMap.forEach((ingredient) => {
      const categoryId = ingredient.category?.id ?? -1;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, []);
      }
      categoryMap.get(categoryId).push(ingredient);
    });

    // Convert to array of category groups
    const groups: any[] = [];

    const normalizedQuery = this.searchQuery.toLowerCase().trim();

    categoryMap.forEach((ingredients, categoryId) => {
      const category = categoryId === -1
        ? { id: -1, name: "Uncategorized" }
        : this.categories.find((c) => c.id === categoryId) ??
          { id: -1, name: "Unknown" };

      // Filter groups by category selection
      if (this.selectedCategory && this.selectedCategory.id !== category.id) {
        return;
      }

      // Filter ingredients by search query
      const filteredIngredients = ingredients.filter((ing: any) =>
        ing.name.toLowerCase().includes(normalizedQuery)
      );

      // Only add group if it has matching ingredients
      if (filteredIngredients.length > 0) {
        groups.push({ category, ingredients: filteredIngredients });
      }
    });

    return groups.sort((a, b) =>
      a.category.name.localeCompare(b.category.name)
    );
  }

  public expandedIngredients = new Set<string>();

  public toggleIngredient(ingredientId: string): void {
    if (this.expandedIngredients.has(ingredientId)) {
      this.expandedIngredients.delete(ingredientId);
    } else {
      this.expandedIngredients.add(ingredientId);
    }
  }

  public isExpanded(ingredientId: string): boolean {
    return this.expandedIngredients.has(ingredientId);
  }

  @HostListener("window:scroll", [])
  onWindowScroll(): void {
    this.showScrollTopButton = window.scrollY > this.scrollThreshold;
  }

  public scrollToTop(): void {
    window.scrollTo({ top: this.scrollLocation, behavior: "smooth" });
  }

  ngOnInit(): void {
    this.initParameters();
  }

  private initParameters(): void {
    this.isLoading.set(true);
    this.inventoryService.getItems().subscribe((items) => {
      this.items = sortItemsByExpirationDate(items);
      this.totalItemsCount = this.items.length;
      this.expiringSoonItemsCount = this.items.filter((item) =>
        isExpiringSoon(item)
      ).length;
      this.expiredItemsCount =
        this.items.filter((item: Item) => isExpired(item)).length;
      // Small delay to ensure animation system is ready
      setTimeout(() => {
        this.isLoading.set(false);
      }, this.loadingDelayMs);
    });
    this.unitService.getUnits().subscribe((units) => {
      this.units = units;
    });
    this.locationService.getLocations().subscribe((locations) => {
      this.locations = locations;
    });
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients = ingredients;
    });
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  public onAddItem(item: Item): void {
    this.inventoryService.addItem(item).subscribe(() => {
      this.initParameters();
    });
    this.messageService.add({
      severity: this.successNotificationClass,
      summary: this.translocoService.translate(
        "inventory.notificationService.itemAddedHeader",
      ) +
        item.name,
      detail: this.translocoService.translate(
        "inventory.notificationService.itemAddedDescription",
      ),
    });
  }

  public onDeleteItem(item: Item): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate(
        "inventory.removeConfirmationService.header",
      ),
      message: this.translocoService.translate(
        "inventory.removeConfirmationService.message",
      ),
      icon: this.removeConfirmationServiceIcon,
      accept: () => {
        this.inventoryService.removeItem(item).subscribe(() => {
          this.initParameters();
        });
        this.messageService.add({
          severity: this.successNotificationClass,
          summary: this.translocoService.translate(
            "inventory.notificationService.itemRemovalHeader",
          ) +
            item.name,
          detail: this.translocoService.translate(
            "inventory.notificationService.itemRemovalDescription",
          ),
        });
      },
      reject: () => {
        this.messageService.add({
          severity: this.errorNotificationClass,
          summary: this.translocoService.translate(
            "inventory.notificationService.itemRemovalFailedHeader",
          ) + item.name,
          detail: this.translocoService.translate(
            "inventory.notificationService.itemRemovalFailedCancelledDescription",
          ),
        });
      },
    });
  }

  public onUpdateItem(updatedItem: Item): void {
    this.inventoryService.updateItem(updatedItem).subscribe(() => {
      this.initParameters();
      this.messageService.add({
        severity: this.successNotificationClass,
        summary: this.translocoService.translate(
          "inventory.notificationService.itemUpdatedHeader",
        ) +
          updatedItem.name,
        detail: this.translocoService.translate(
          "inventory.notificationService.itemUpdatedDescription",
        ),
      });
    });
  }

  public onTabChange(tab: InventoryTab): void {
    this.activeTab = tab;
  }
}
