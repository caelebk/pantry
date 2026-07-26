import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
})
export class ShoppingListComponent {
  readonly shoppingListService = inject(ShoppingListService);
  readonly mealPlannerService = inject(MealPlannerService);

  // Form model for quick item creation
  newName = '';
  newCategory = 'Produce';
  newQuantity = 1;
  newUnit = 'pcs';
  newEstimatedPrice = 0;
  newStoreName = '';

  readonly categories = ['Produce', 'Dairy', 'Meat & Seafood', 'Pantry', 'Bakery', 'Beverage', 'Frozen', 'General'];
  readonly units = ['pcs', 'kg', 'g', 'lbs', 'oz', 'bottle', 'can', 'pack', 'heads', 'bunch', 'ml', 'carton', 'wedge'];

  // Filter state
  activeFilter = signal<'all' | 'unchecked' | 'checked'>('all');

  // Filtered items signal
  readonly filteredItems = computed(() => {
    const items = this.shoppingListService.items();
    const filter = this.activeFilter();
    if (filter === 'unchecked') return items.filter((i) => !i.checked);
    if (filter === 'checked') return items.filter((i) => i.checked);
    return items;
  });

  readonly totalCount = computed(() => this.shoppingListService.items().length);
  readonly checkedCount = computed(() => this.shoppingListService.items().filter((i) => i.checked).length);
  readonly uncheckedCount = computed(() => this.shoppingListService.items().filter((i) => !i.checked).length);

  // Price & Budget Calculations
  readonly totalEstimatedCost = computed(() => {
    return this.shoppingListService
      .items()
      .reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  });

  readonly inCartCost = computed(() => {
    return this.shoppingListService
      .items()
      .filter((i) => i.checked)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  });

  readonly remainingCost = computed(() => {
    return this.shoppingListService
      .items()
      .filter((i) => !i.checked)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  });

  // Recipes in current Meal Plan
  readonly plannedRecipesCount = computed(() => {
    return this.mealPlannerService.meals().length;
  });

  readonly plannedRecipesMissingCount = computed(() => {
    return this.mealPlannerService
      .meals()
      .reduce((acc, m) => acc + (m.missingIngredients ? m.missingIngredients.length : 0), 0);
  });

  addItem(): void {
    if (!this.newName.trim()) return;

    this.shoppingListService.addItem({
      name: this.newName.trim(),
      category: this.newCategory,
      quantity: this.newQuantity || 1,
      unit: this.newUnit,
      estimatedPrice: this.newEstimatedPrice || 0,
      storeName: this.newStoreName || '',
      source: 'manual',
    });

    this.newName = '';
    this.newQuantity = 1;
    this.newEstimatedPrice = 0;
    this.newStoreName = '';
  }

  updateItemPrice(item: ShoppingItem, priceStr: string): void {
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price >= 0) {
      this.shoppingListService.updateItemPrice(item.id, price);
    }
  }

  autoFillFromMealPlanner(): void {
    this.mealPlannerService.addAllMissingToShoppingList();
  }

  toggleItem(id: string): void {
    this.shoppingListService.toggleItem(id);
  }

  removeItem(id: string): void {
    this.shoppingListService.removeItem(id);
  }

  clearChecked(): void {
    this.shoppingListService.clearChecked();
  }

  restockChecked(): void {
    this.shoppingListService.restockCheckedItems();
  }

  setFilter(filter: 'all' | 'unchecked' | 'checked'): void {
    this.activeFilter.set(filter);
  }

  getSourceBadgeClass(source?: string): string {
    switch (source) {
      case 'low_stock':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
      case 'recipe_plan':
        return 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-900/50';
      default:
        return 'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  }

  getSourceLabel(item: ShoppingItem): string {
    if (item.source === 'low_stock') return 'Low Stock Alert';
    if (item.source === 'recipe_plan') return item.recipeName ? `Recipe: ${item.recipeName}` : 'Recipe Plan';
    return 'Manual Entry';
  }
}
