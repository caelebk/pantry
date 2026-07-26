import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
})
export class ShoppingListComponent {
  private readonly router = inject(Router);
  readonly shoppingListService = inject(ShoppingListService);
  readonly mealPlannerService = inject(MealPlannerService);

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

  goToAddItemPage(): void {
    this.router.navigate(['/shopping-list/new']);
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
}
