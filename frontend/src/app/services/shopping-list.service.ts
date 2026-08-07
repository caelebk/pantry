import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { AddShoppingItemDTO, ShoppingItem } from '@models/shopping-list.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = '/api/shopping-list';

  private readonly itemsSignal = signal<ShoppingItem[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  constructor() {
    this.loadItemsFromBackend();
  }

  public loadItemsFromBackend(): void {
    this.http
      .get<ApiResponse<ShoppingItem[]>>(this.apiUrl)
      .pipe(mapResponseData<ShoppingItem[]>())
      .subscribe({
        next: (data) => {
          this.itemsSignal.set(data || []);
        },
        error: (err) => {
          console.error('Failed to load shopping list from backend:', err);
        },
      });
  }

  getItems(): ShoppingItem[] {
    return this.itemsSignal();
  }

  addItem(dto: AddShoppingItemDTO): void {
    const payload = {
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

    this.http
      .post<ApiResponse<ShoppingItem>>(this.apiUrl, payload)
      .pipe(mapResponseData<ShoppingItem>())
      .subscribe({
        next: (newItem) => {
          this.itemsSignal.update((curr) => [newItem, ...curr]);
          this.toastService.showSuccess(`Added "${dto.name}" to shopping list`, 'Shopping List');
        },
        error: (err) => {
          console.error('Failed to add shopping list item:', err);
          this.toastService.showError('Failed to add item to shopping list on server.');
        },
      });
  }

  addMultipleItems(items: AddShoppingItemDTO[]): void {
    const payload = items.map((dto) => ({
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

    this.http
      .post<ApiResponse<ShoppingItem[]>>(`${this.apiUrl}/bulk`, payload)
      .pipe(mapResponseData<ShoppingItem[]>())
      .subscribe({
        next: (newItems) => {
          this.itemsSignal.update((curr) => [...newItems, ...curr]);
          this.toastService.showSuccess(
            `Added ${items.length} missing ingredient(s) to shopping list`,
            'Shopping List',
          );
        },
        error: (err) => {
          console.error('Failed to add multiple shopping list items:', err);
          this.toastService.showError('Failed to add items to shopping list on server.');
        },
      });
  }

  updateItemPrice(id: string, price: number): void {
    this.http
      .put<ApiResponse<ShoppingItem>>(`${this.apiUrl}/${id}`, { estimatedPrice: price })
      .pipe(mapResponseData<ShoppingItem>())
      .subscribe({
        next: (updated) => {
          this.itemsSignal.update((curr) => curr.map((item) => (item.id === id ? updated : item)));
        },
        error: (err) => {
          console.error('Failed to update item price:', err);
        },
      });
  }

  updateItemQuantity(id: string, qty: number): void {
    if (qty <= 0) return;
    this.http
      .put<ApiResponse<ShoppingItem>>(`${this.apiUrl}/${id}`, { quantity: qty })
      .pipe(mapResponseData<ShoppingItem>())
      .subscribe({
        next: (updated) => {
          this.itemsSignal.update((curr) => curr.map((item) => (item.id === id ? updated : item)));
        },
        error: (err) => {
          console.error('Failed to update item quantity:', err);
        },
      });
  }

  toggleItem(id: string): void {
    const item = this.itemsSignal().find((i) => i.id === id);
    if (!item) return;

    this.http
      .put<ApiResponse<ShoppingItem>>(`${this.apiUrl}/${id}`, { checked: !item.checked })
      .pipe(mapResponseData<ShoppingItem>())
      .subscribe({
        next: (updated) => {
          this.itemsSignal.update((curr) => curr.map((i) => (i.id === id ? updated : i)));
        },
        error: (err) => {
          console.error('Failed to toggle item checked state:', err);
        },
      });
  }

  removeItem(id: string): void {
    const item = this.itemsSignal().find((i) => i.id === id);
    this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<unknown>())
      .subscribe({
        next: () => {
          this.itemsSignal.update((curr) => curr.filter((i) => i.id !== id));
          if (item) {
            this.toastService.showInfo(`Removed "${item.name}" from shopping list`);
          }
        },
        error: (err) => {
          console.error('Failed to remove shopping list item:', err);
        },
      });
  }

  clearChecked(): void {
    const count = this.itemsSignal().filter((i) => i.checked).length;
    if (count === 0) return;

    this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/checked`)
      .pipe(mapResponseData<unknown>())
      .subscribe({
        next: () => {
          this.itemsSignal.update((curr) => curr.filter((i) => !i.checked));
          this.toastService.showInfo(`Cleared ${count} completed item(s)`);
        },
        error: (err) => {
          console.error('Failed to clear checked shopping list items:', err);
        },
      });
  }

  restockCheckedItems(): void {
    const checkedItems = this.itemsSignal().filter((i) => i.checked);
    if (checkedItems.length === 0) {
      this.toastService.showWarning('No checked items to restock');
      return;
    }

    this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/checked`)
      .pipe(mapResponseData<unknown>())
      .subscribe({
        next: () => {
          this.itemsSignal.update((curr) => curr.filter((i) => !i.checked));
          this.toastService.showSuccess(
            `Restocked ${checkedItems.length} item(s) directly into your pantry inventory!`,
            'Restock Complete',
          );
        },
        error: (err) => {
          console.error('Failed to restock checked items:', err);
        },
      });
  }
}
