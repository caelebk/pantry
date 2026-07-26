import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import {
  IngredientGroup as InventoryIngredientGroup,
  NutrientGroup,
} from '@models/inventory.models';
import { Item } from '@models/items.model';
import { NutrientType } from '@models/nutrient-type.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { NutrientTypeService } from '@services/inventory/nutrient-type.service';
import { ToastService } from '@services/toast.service';
import { IngredientGroupContainerComponent } from '../inventory-components/ingredient-group-container/ingredient-group-container.component';

@Component({
  selector: 'pantry-ingredient-groups-page',
  standalone: true,
  imports: [CommonModule, IngredientGroupContainerComponent],
  templateUrl: './ingredient-groups-page.component.html',
})
export class IngredientGroupsPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly itemService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly categoryService = inject(CategoryService);
  private readonly nutrientTypeService = inject(NutrientTypeService);
  private readonly toastService = inject(ToastService);

  public items = signal<Item[]>([]);
  public ingredients = signal<Ingredient[]>([]);
  public categories = signal<Category[]>([]);
  public nutrientTypes = signal<NutrientType[]>([]);
  public isLoading = signal<boolean>(true);
  public searchQuery = signal<string>('');
  public selectedCategory = signal<Category | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.itemService.getItems().subscribe({
      next: (items) => this.items.set(items),
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => this.ingredients.set(ingredients),
    });

    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });

    this.nutrientTypeService.getNutrientTypes().subscribe({
      next: (nutrientTypes) => {
        this.nutrientTypes.set(nutrientTypes);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ingredient taxonomy data:', err);
        this.toastService.showError('Unable to load ingredient taxonomy.');
        this.isLoading.set(false);
      },
    });
  }

  public categoryGroups = computed(() => {
    const itemsList = this.items();
    const ingredientsList = this.ingredients();
    const categoriesList = this.categories();
    const query = this.searchQuery().toLowerCase().trim();
    const selCategory = this.selectedCategory();

    const ingredientMap = new Map();

    ingredientsList.forEach((ingredient) => {
      const ingredientItems = itemsList.filter((item) => item.ingredientId === ingredient.id);
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

    const groups: InventoryIngredientGroup[] = [];

    categoryMap.forEach((ingList, categoryId) => {
      const category =
        categoryId === -1
          ? { id: -1, name: 'Uncategorized' }
          : (categoriesList.find((c) => c.id === categoryId) ?? { id: -1, name: 'Unknown' });

      if (selCategory && selCategory.id !== category.id) {
        return;
      }

      const filteredIngredients = ingList.filter((ing: any) =>
        ing.name.toLowerCase().includes(query),
      );

      if (filteredIngredients.length > 0) {
        groups.push({ category, ingredients: filteredIngredients });
      }
    });

    return groups.sort((a, b) => a.category.name.localeCompare(b.category.name));
  });

  public nutrientGroups = computed(() => {
    const catGroups = this.categoryGroups();
    const categoriesList = this.categories();
    const nutrientTypesList = this.nutrientTypes();
    const query = this.searchQuery().toLowerCase().trim();
    const selCategory = this.selectedCategory();
    const hasSearchOrCategoryFilter = query.length > 0 || selCategory !== null;

    const catGroupsMap = new Map<number, InventoryIngredientGroup>();
    catGroups.forEach((cg) => {
      catGroupsMap.set(cg.category.id, cg);
    });

    const result: NutrientGroup[] = [];

    nutrientTypesList.forEach((nt) => {
      const categoriesForNt = categoriesList.filter((c) => c.nutrientTypeId === nt.id);
      const categoryGroupsInNt: InventoryIngredientGroup[] = [];

      categoriesForNt.forEach((cat) => {
        if (selCategory && selCategory.id !== cat.id) {
          return;
        }
        const existingGroup = catGroupsMap.get(cat.id);
        if (existingGroup) {
          categoryGroupsInNt.push(existingGroup);
        } else if (!hasSearchOrCategoryFilter) {
          categoryGroupsInNt.push({ category: cat, ingredients: [] });
        }
      });

      if (!hasSearchOrCategoryFilter || categoryGroupsInNt.length > 0) {
        result.push({
          nutrientType: nt,
          categoryGroups: categoryGroupsInNt.sort((a, b) =>
            a.category.name.localeCompare(b.category.name),
          ),
        });
      }
    });

    const knownCatIds = new Set(categoriesList.map((c) => c.id));
    const uncategorizedCatGroups = catGroups.filter(
      (cg) =>
        !knownCatIds.has(cg.category.id) ||
        !categoriesList.find((c) => c.id === cg.category.id)?.nutrientTypeId,
    );

    if (uncategorizedCatGroups.length > 0) {
      result.push({
        nutrientType: {
          id: -1,
          name: 'Unclassified',
          icon: '📦',
          color: '#94a3b8',
          description: 'Categories without an assigned nutrient group',
        },
        categoryGroups: uncategorizedCatGroups,
      });
    }

    return result.sort((a, b) => {
      if (a.nutrientType.id === -1) return 1;
      if (b.nutrientType.id === -1) return -1;
      return a.nutrientType.name.localeCompare(b.nutrientType.name);
    });
  });

  onAddGroup(): void {
    this.router.navigate(['/inventory/groups/new']);
  }

  onUnassignItem(item: Item): void {
    const updatedItem: Item = {
      ...item,
      ingredientId: undefined,
    };
    this.itemService.updateItem(updatedItem).subscribe({
      next: () => {
        this.toastService.showSuccess(`Unassigned "${item.name}"`, 'Item Unassigned');
        this.loadData();
      },
      error: () => {
        this.toastService.showError('Failed to unassign item.', 'Error');
      },
    });
  }
}
