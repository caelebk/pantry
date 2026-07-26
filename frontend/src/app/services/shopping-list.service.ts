import { inject, Injectable, signal } from '@angular/core';
import { AddShoppingItemDTO, ShoppingItem } from '@models/shopping-list.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private readonly toastService = inject(ToastService);

  private readonly itemsSignal = signal<ShoppingItem[]>([
    {
      id: 'shop-1',
      name: 'Olive Oil (Extra Virgin)',
      category: 'Pantry',
      quantity: 1,
      unit: 'bottle',
      checked: false,
      estimatedPrice: 9.99,
      storeName: 'Trader Joe\'s',
      source: 'low_stock',
    },
    {
      id: 'shop-2',
      name: 'Heavy Cream',
      category: 'Dairy',
      quantity: 1,
      unit: 'carton',
      checked: true,
      estimatedPrice: 3.49,
      storeName: 'Safeway',
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
      estimatedPrice: 2.50,
      storeName: 'Whole Foods',
      source: 'recipe_plan',
      recipeName: 'Simple Tomato Basil Pasta',
    },
    {
      id: 'shop-4',
      name: 'Garlic Bulbs',
      category: 'Produce',
      quantity: 2,
      unit: 'heads',
      checked: false,
      estimatedPrice: 1.20,
      storeName: 'Trader Joe\'s',
      source: 'low_stock',
    },
    {
      id: 'shop-5',
      name: 'Salmon Fillets',
      category: 'Seafood',
      quantity: 2,
      unit: 'pcs',
      checked: false,
      estimatedPrice: 14.50,
      storeName: 'Costco',
      source: 'recipe_plan',
      recipeName: 'Honey Garlic Salmon',
    },
    {
      id: 'shop-6',
      name: 'Parmesan Cheese',
      category: 'Dairy',
      quantity: 1,
      unit: 'wedge',
      checked: false,
      estimatedPrice: 5.99,
      storeName: 'Whole Foods',
      source: 'recipe_plan',
      recipeName: 'Simple Tomato Basil Pasta',
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
      estimatedPrice: dto.estimatedPrice || 0,
      storeName: dto.storeName || '',
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
      estimatedPrice: dto.estimatedPrice || 0,
      storeName: dto.storeName || '',
      source: dto.source || 'recipe_plan',
      recipeName: dto.recipeName,
    }));

    this.itemsSignal.update((curr) => [...newItems, ...curr]);
    this.toastService.showSuccess(`Added ${items.length} missing ingredient(s) to shopping list`, 'Shopping List');
  }

  updateItemPrice(id: string, price: number): void {
    this.itemsSignal.update((curr) =>
      curr.map((item) => (item.id === id ? { ...item, estimatedPrice: price } : item))
    );
  }

  updateItemQuantity(id: string, qty: number): void {
    if (qty <= 0) return;
    this.itemsSignal.update((curr) =>
      curr.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
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

    this.itemsSignal.update((curr) => curr.filter((i) => !i.checked));
    this.toastService.showSuccess(
      `Restocked ${checkedItems.length} item(s) directly into your pantry inventory!`,
      'Restock Complete'
    );
  }
}
