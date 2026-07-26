import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientGroup } from '@models/category.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { CategoryService } from '@services/inventory/category.service';
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

export interface GroupedIngredients {
  groupName: string;
  groupId: string | number | null;
  ingredients: Ingredient[];
}

@Component({
  selector: 'pantry-ingredients-page',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule],
  templateUrl: './ingredients-page.component.html',
  styles: [
    `
      :host ::ng-deep .p-select {
        height: 2.25rem !important;
      }
      :host ::ng-deep .p-select .p-select-label {
        padding: 0.375rem 0.625rem !important;
        font-size: 0.75rem !important;
        line-height: 1rem !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
      }
      :host ::ng-deep .p-select .p-select-dropdown {
        width: 1.75rem !important;
      }
      :host ::ng-deep .p-select .p-select-dropdown .p-icon {
        width: 0.75rem !important;
        height: 0.75rem !important;
      }
    `,
  ],
})
export class IngredientsPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ingredientService = inject(IngredientService);
  private readonly categoryService = inject(CategoryService);
  private readonly itemService = inject(ItemService);
  private readonly toastService = inject(ToastService);

  public ingredients = signal<Ingredient[]>([]);
  public items = signal<Item[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public isLoading = signal<boolean>(true);
  public searchQuery = signal<string>('');
  public selectedGroup = signal<IngredientGroup | null>(null);

  // Set of expanded ingredient IDs for collapsible rows
  public expandedIngredientIds = signal<Set<string>>(new Set());

  // Set of expanded group names for collapsible category tables (collapsed by default)
  public expandedGroupNames = signal<Set<string>>(new Set());

  public filteredIngredients = computed(() => {
    const list = this.ingredients();
    const query = this.searchQuery().toLowerCase().trim();
    const group = this.selectedGroup();

    return list.filter((ing) => {
      const matchesSearch = !query || ing.name.toLowerCase().includes(query);
      const matchesGroup = !group || ing.ingredientGroup?.id === group.id;
      return matchesSearch && matchesGroup;
    });
  });

  public groupedIngredients = computed<GroupedIngredients[]>(() => {
    const ingredientsList = this.filteredIngredients();
    const groupsMap = new Map<string, GroupedIngredients>();

    for (const ing of ingredientsList) {
      const groupName = ing.ingredientGroup?.name || 'Unassigned Ingredients';
      const groupId = ing.ingredientGroup?.id || null;

      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, {
          groupName,
          groupId,
          ingredients: [],
        });
      }
      groupsMap.get(groupName)!.ingredients.push(ing);
    }

    // Sort ingredients inside each group by stock count (in stock first, then out of stock, then alphabetically)
    // Sort groups alphabetically, with Unassigned at the end
    return Array.from(groupsMap.values())
      .map((group) => {
        const sortedIngredients = [...group.ingredients].sort((a, b) => {
          const countA = this.getConnectedItems(a.id).length;
          const countB = this.getConnectedItems(b.id).length;
          if (countA !== countB) {
            return countB - countA; // Higher stock count (In Stock) first
          }
          return a.name.localeCompare(b.name);
        });
        return { ...group, ingredients: sortedIngredients };
      })
      .sort((a, b) => {
        if (a.groupId === null) return 1;
        if (b.groupId === null) return -1;
        return a.groupName.localeCompare(b.groupName);
      });
  });

  // Lazy loading batch limit for performance optimization
  public displayLimit = signal<number>(8);

  public visibleGroupedIngredients = computed(() => {
    return this.groupedIngredients().slice(0, this.displayLimit());
  });

  public hasMoreGroups = computed(() => {
    return this.groupedIngredients().length > this.displayLimit();
  });

  public loadMoreGroups(): void {
    this.displayLimit.update((limit) => limit + 8);
  }

  public onSearchChange(query: string): void {
    this.searchQuery.set(query || '');
    this.displayLimit.set(8);
  }

  public onGroupChange(group: IngredientGroup | null): void {
    this.selectedGroup.set(group);
    this.displayLimit.set(8);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.categoryService.getIngredientGroups().subscribe({
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

  getConnectedItems(ingredientId: string): Item[] {
    return this.items().filter((item) => item.ingredientId === ingredientId);
  }

  getTotalQuantityText(ingredientId: string): string {
    const connected = this.getConnectedItems(ingredientId);
    if (connected.length === 0) return '0 items';

    // Sum quantities if same unit or express as breakdown
    const unitMap = new Map<string, number>();
    for (const item of connected) {
      const unitName = item.unit.shortName || item.unit.name;
      unitMap.set(unitName, (unitMap.get(unitName) || 0) + item.quantity);
    }

    const parts: string[] = [];
    unitMap.forEach((qty, unit) => {
      parts.push(`${qty} ${unit}`);
    });
    return parts.join(', ');
  }

  isExpanded(ingredientId: string): boolean {
    return this.expandedIngredientIds().has(ingredientId);
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroupNames().has(groupName);
  }

  toggleGroup(groupName: string): void {
    const current = new Set(this.expandedGroupNames());
    if (current.has(groupName)) {
      current.delete(groupName);
    } else {
      current.add(groupName);
    }
    this.expandedGroupNames.set(current);
  }

  toggleRow(ingredientId: string): void {
    const current = new Set(this.expandedIngredientIds());
    if (current.has(ingredientId)) {
      current.delete(ingredientId);
    } else {
      current.add(ingredientId);
    }
    this.expandedIngredientIds.set(current);
  }

  expandAll(): void {
    const allIds = new Set(this.filteredIngredients().map((i) => i.id));
    this.expandedIngredientIds.set(allIds);
    const allGroups = new Set(this.groupedIngredients().map((g) => g.groupName));
    this.expandedGroupNames.set(allGroups);
  }

  collapseAll(): void {
    this.expandedIngredientIds.set(new Set());
    this.expandedGroupNames.set(new Set());
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

  onAddStockItemForIngredient(ing: Ingredient): void {
    this.router.navigate(['/inventory/items/new']);
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
        error: (err: any) => {
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
    return getTimeDifferenceString(new Date(), item.expirationDate);
  }
}
