import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ShoppingItem } from '@models/shopping-list.model';
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

  // Form model for quick item creation
  newName = '';
  newCategory = 'Produce';
  newQuantity = 1;
  newUnit = 'pcs';

  readonly categories = ['Produce', 'Dairy', 'Meat & Seafood', 'Pantry', 'Bakery', 'Beverage', 'Frozen', 'General'];
  readonly units = ['pcs', 'kg', 'g', 'lbs', 'oz', 'bottle', 'can', 'pack', 'heads', 'bunch', 'ml'];

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

  addItem(): void {
    if (!this.newName.trim()) return;

    this.shoppingListService.addItem({
      name: this.newName.trim(),
      category: this.newCategory,
      quantity: this.newQuantity || 1,
      unit: this.newUnit,
      source: 'manual',
    });

    this.newName = '';
    this.newQuantity = 1;
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
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'recipe_plan':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-surface-500/10 text-surface-600 dark:text-surface-400 border-surface-500/20';
    }
  }

  getSourceLabel(item: ShoppingItem): string {
    if (item.source === 'low_stock') return 'Low Stock Alert';
    if (item.source === 'recipe_plan') return item.recipeName ? `Recipe: ${item.recipeName}` : 'Recipe Plan';
    return 'Manual Entry';
  }
}
