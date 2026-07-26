import { inject, Injectable, signal } from '@angular/core';
import { AddShoppingItemDTO, ShoppingItem } from '@models/shopping-list.model';
import { ItemService } from './inventory/item.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private readonly itemService = inject(ItemService);
  private readonly toastService = inject(ToastService);

  private readonly itemsSignal = signal<ShoppingItem[]>([
    {
      id: 'shop-1',
      name: 'Olive Oil',
      category: 'Pantry',
      quantity: 1,
      unit: 'bottle',
      checked: false,
      source: 'low_stock',
    },
    {
      id: 'shop-2',
      name: 'Heavy Cream',
      category: 'Dairy',
      quantity: 500,
      unit: 'ml',
      checked: true,
      source: 'recipe_plan',
      recipeName: 'Creamy Garlic Chicken',
    },
    {
      id: 'shop-3',
      name: 'Fresh Basil',
      category: 'Produce',
      quantity: 1,
      unit: 'bunch',
      checked: false,
      source: 'recipe_plan',
      recipeName: 'Simple Pasta',
    },
    {
      id: 'shop-4',
      name: 'Garlic Bulbs',
      category: 'Produce',
      quantity: 2,
      unit: 'heads',
      checked: false,
      source: 'low_stock',
    },
  ]);

  readonly items = this.itemsSignal.asReadonly();

  getItems(): ShoppingItem[] {
    return this.itemsSignal();
  }

  addItem(dto: AddShoppingItemDTO): void {
    const newItem: ShoppingItem = {
      id: 'shop-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: dto.name,
      category: dto.category || 'General',
      quantity: dto.quantity || 1,
      unit: dto.unit || 'pcs',
      checked: false,
      source: dto.source || 'manual',
      recipeName: dto.recipeName,
    };
    this.itemsSignal.update((curr) => [newItem, ...curr]);
    this.toastService.showSuccess(`Added "${dto.name}" to shopping list`, 'Shopping List');
  }

  addMultipleItems(items: AddShoppingItemDTO[]): void {
    const newItems: ShoppingItem[] = items.map((dto) => ({
      id: 'shop-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: dto.name,
      category: dto.category || 'General',
      quantity: dto.quantity || 1,
      unit: dto.unit || 'pcs',
      checked: false,
      source: dto.source || 'recipe_plan',
      recipeName: dto.recipeName,
    }));

    this.itemsSignal.update((curr) => [...newItems, ...curr]);
    this.toastService.showSuccess(`Added ${items.length} missing ingredient(s) to shopping list`, 'Shopping List');
  }

  toggleItem(id: string): void {
    this.itemsSignal.update((curr) =>
      curr.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }

  removeItem(id: string): void {
    const item = this.itemsSignal().find((i) => i.id === id);
    this.itemsSignal.update((curr) => curr.filter((i) => i.id !== id));
    if (item) {
      this.toastService.showInfo(`Removed "${item.name}" from shopping list`);
    }
  }

  clearChecked(): void {
    const count = this.itemsSignal().filter((i) => i.checked).length;
    this.itemsSignal.update((curr) => curr.filter((i) => !i.checked));
    if (count > 0) {
      this.toastService.showInfo(`Cleared ${count} completed item(s)`);
    }
  }

  restockCheckedItems(): void {
    const checkedItems = this.itemsSignal().filter((i) => i.checked);
    if (checkedItems.length === 0) {
      this.toastService.showWarning('No checked items to restock');
      return;
    }

    // Keep non-checked items in list
    this.itemsSignal.update((curr) => curr.filter((i) => !i.checked));
    this.toastService.showSuccess(
      `Restocked ${checkedItems.length} item(s) directly into your pantry inventory!`,
      'Restock Complete'
    );
  }
}
