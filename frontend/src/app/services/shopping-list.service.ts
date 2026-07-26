import { inject, Injectable, signal } from '@angular/core';
import { AddShoppingItemDTO, ShoppingItem } from '@models/shopping-list.model';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'pantry_shopping_list_items';

const DEFAULT_ITEMS: ShoppingItem[] = [
  {
    id: 'shop-1',
    name: 'Olive Oil (Extra Virgin)',
    category: 'Pantry',
    quantity: 1,
    unit: 'bottle',
    checked: false,
    estimatedPrice: 9.99,
    storeName: "Trader Joe's",
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
    storeName: "Trader Joe's",
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
];

function loadItemsFromStorage(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse shopping list from localStorage:', err);
  }
  return DEFAULT_ITEMS;
}

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private readonly toastService = inject(ToastService);

  private readonly itemsSignal = signal<ShoppingItem[]>(loadItemsFromStorage());

  readonly items = this.itemsSignal.asReadonly();

  private persistItems(items: ShoppingItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save shopping list to localStorage:', err);
    }
  }

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
    this.itemsSignal.update((curr) => {
      const next = [newItem, ...curr];
      this.persistItems(next);
      return next;
    });
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

    this.itemsSignal.update((curr) => {
      const next = [...newItems, ...curr];
      this.persistItems(next);
      return next;
    });
    this.toastService.showSuccess(`Added ${items.length} missing ingredient(s) to shopping list`, 'Shopping List');
  }

  updateItemPrice(id: string, price: number): void {
    this.itemsSignal.update((curr) => {
      const next = curr.map((item) => (item.id === id ? { ...item, estimatedPrice: price } : item));
      this.persistItems(next);
      return next;
    });
  }

  updateItemQuantity(id: string, qty: number): void {
    if (qty <= 0) return;
    this.itemsSignal.update((curr) => {
      const next = curr.map((item) => (item.id === id ? { ...item, quantity: qty } : item));
      this.persistItems(next);
      return next;
    });
  }

  toggleItem(id: string): void {
    this.itemsSignal.update((curr) => {
      const next = curr.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      this.persistItems(next);
      return next;
    });
  }

  removeItem(id: string): void {
    const item = this.itemsSignal().find((i) => i.id === id);
    this.itemsSignal.update((curr) => {
      const next = curr.filter((i) => i.id !== id);
      this.persistItems(next);
      return next;
    });
    if (item) {
      this.toastService.showInfo(`Removed "${item.name}" from shopping list`);
    }
  }

  clearChecked(): void {
    const count = this.itemsSignal().filter((i) => i.checked).length;
    this.itemsSignal.update((curr) => {
      const next = curr.filter((i) => !i.checked);
      this.persistItems(next);
      return next;
    });
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

    this.itemsSignal.update((curr) => {
      const next = curr.filter((i) => !i.checked);
      this.persistItems(next);
      return next;
    });
    this.toastService.showSuccess(
      `Restocked ${checkedItems.length} item(s) directly into your pantry inventory!`,
      'Restock Complete'
    );
  }
}
