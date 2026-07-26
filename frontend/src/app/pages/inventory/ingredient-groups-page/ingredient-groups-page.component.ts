import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import {
  IngredientCategoryCluster,
  IngredientGroupCluster,
} from '@models/inventory.models';
import { Item } from '@models/items.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
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
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly toastService = inject(ToastService);

  public items = signal<Item[]>([]);
  public ingredients = signal<Ingredient[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public ingredientCategories = signal<IngredientCategory[]>([]);
  public isLoading = signal<boolean>(true);
  public searchQuery = signal<string>('');
  public selectedGroup = signal<IngredientGroup | null>(null);

  public get categories() {
    return this.ingredientGroups;
  }

  public get selectedCategory() {
    return this.selectedGroup;
  }

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

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (categories) => {
        this.ingredientCategories.set(categories);
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
    const groupsList = this.ingredientGroups();
    const query = this.searchQuery().toLowerCase().trim();
    const selGroup = this.selectedGroup();

    const ingredientMap = new Map();

    ingredientsList.forEach((ingredient) => {
      const ingredientItems = itemsList.filter((item) => item.ingredientId === ingredient.id);
      ingredientMap.set(ingredient.id, {
        ...ingredient,
        items: ingredientItems,
        itemCount: ingredientItems.length,
      });
    });

    const groupMap = new Map();

    ingredientMap.forEach((ingredient) => {
      const groupId = ingredient.ingredientGroup?.id ?? -1;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId).push(ingredient);
    });

    const clusters: IngredientGroupCluster[] = [];

    groupMap.forEach((ingList, groupId) => {
      const group =
        groupId === -1
          ? { id: -1, name: 'Uncategorized' }
          : (groupsList.find((g) => g.id === groupId) ?? { id: -1, name: 'Unknown' });

      if (selGroup && selGroup.id !== group.id) {
        return;
      }

      const filteredIngredients = ingList.filter((ing: any) =>
        ing.name.toLowerCase().includes(query),
      );

      if (filteredIngredients.length > 0) {
        clusters.push({ group, ingredients: filteredIngredients });
      }
    });

    return clusters.sort((a, b) => a.group.name.localeCompare(b.group.name));
  });

  public nutrientGroups = computed(() => {
    const catGroups = this.categoryGroups();
    const groupsList = this.ingredientGroups();
    const categoriesList = this.ingredientCategories();
    const query = this.searchQuery().toLowerCase().trim();
    const selGroup = this.selectedGroup();
    const hasSearchOrFilter = query.length > 0 || selGroup !== null;

    const groupClustersMap = new Map<number, IngredientGroupCluster>();
    catGroups.forEach((cg) => {
      groupClustersMap.set(cg.group.id, cg);
    });

    const result: IngredientCategoryCluster[] = [];

    categoriesList.forEach((cat) => {
      const groupsForCat = groupsList.filter((g) => (g.ingredientCategoryId ?? g.nutrientGroupId) === cat.id);
      const categoryGroupsInCat: IngredientGroupCluster[] = [];

      groupsForCat.forEach((grp) => {
        if (selGroup && selGroup.id !== grp.id) {
          return;
        }
        const existingCluster = groupClustersMap.get(grp.id);
        if (existingCluster) {
          categoryGroupsInCat.push(existingCluster);
        } else if (!hasSearchOrFilter) {
          categoryGroupsInCat.push({ group: grp, ingredients: [] });
        }
      });

      if (!hasSearchOrFilter || categoryGroupsInCat.length > 0) {
        result.push({
          category: cat,
          ingredientGroups: categoryGroupsInCat.sort((a, b) =>
            a.group.name.localeCompare(b.group.name),
          ),
        });
      }
    });

    const knownGroupIds = new Set(groupsList.map((g) => g.id));
    const uncategorizedClusters = catGroups.filter(
      (cg) =>
        !knownGroupIds.has(cg.group.id) ||
        !groupsList.find((g) => g.id === cg.group.id)?.ingredientCategoryId,
    );

    if (uncategorizedClusters.length > 0) {
      result.push({
        category: {
          id: -1,
          name: 'Unclassified',
          icon: '📦',
          color: '#94a3b8',
          description: 'Groups without an assigned ingredient category',
        },
        ingredientGroups: uncategorizedClusters,
      });
    }

    return result.sort((a, b) => {
      if (a.category.id === -1) return 1;
      if (b.category.id === -1) return -1;
      return a.category.name.localeCompare(b.category.name);
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
