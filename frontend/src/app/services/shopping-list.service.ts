import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ApiResponse } from '@models/http.model';
import { AddShoppingItemDTO, ShoppingItem } from '@models/shopping-list.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/v1/shopping-list';

  private readonly itemsSignal = signal<ShoppingItem[]>([]);
  readonly items = this.itemsSignal.asReadonly();
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.loadItemsFromBackend();
      }
    });
  }

  public loadItemsFromBackend(): void {
    this.isLoading.set(true);
    this.http
      .get<ApiResponse<ShoppingItem[]>>(this.apiUrl)
      .pipe(mapResponseData<ShoppingItem[]>())
      .subscribe({
        next: (data) => {
          this.itemsSignal.set(data || []);
          this.isLoading.set(false);
          this.hasLoaded.set(true);
        },
        error: (err) => {
          console.error('Failed to load shopping list from backend:', err);
          this.isLoading.set(false);
          this.hasLoaded.set(true);
        },
      });
  }

  getItems(): ShoppingItem[] {
    return this.itemsSignal();
  }

  getItem(id: string): Observable<ShoppingItem> {
    return this.http
      .get<ApiResponse<ShoppingItem>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<ShoppingItem>());
  }

  addItem(dto: AddShoppingItemDTO): void {
    this.createItem(dto).subscribe({
      next: (newItem) => {
        this.itemsSignal.update((curr) => [newItem, ...curr]);
        this.toastService.showSuccess(
          this.transloco.translate('shoppingList.toast.added', { name: dto.name }),
          this.transloco.translate('shoppingList.toast.title'),
        );
      },
      error: (err) => {
        console.error('Failed to add shopping list item:', err);
        this.toastService.showError(this.transloco.translate('shoppingList.toast.addFailed'));
      },
    });
  }

  createItem(dto: AddShoppingItemDTO): Observable<ShoppingItem> {
    const payload = {
      name: dto.name,
      ingredientId: dto.ingredientId,
      category: dto.category || 'General',
      quantity: dto.quantity || 1,
      unit: dto.unit || 'pcs',
      checked: false,
      estimatedPrice: dto.estimatedPrice || 0,
      storeName: dto.storeName || '',
      storeId: dto.storeId,
      source: dto.source || 'manual',
      recipeName: dto.recipeName,
      duplicateMode: dto.duplicateMode,
    };
    return this.http
      .post<ApiResponse<ShoppingItem>>(this.apiUrl, payload)
      .pipe(mapResponseData<ShoppingItem>());
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
      ingredientId: dto.ingredientId,
      recipeName: dto.recipeName,
    }));

    this.http
      .post<ApiResponse<ShoppingItem[]>>(`${this.apiUrl}/bulk`, payload)
      .pipe(mapResponseData<ShoppingItem[]>())
      .subscribe({
        next: (newItems) => {
          this.itemsSignal.update((curr) => [...newItems, ...curr]);
          this.toastService.showSuccess(
            this.transloco.translate('shoppingList.toast.addedMissing', { count: items.length }),
            this.transloco.translate('shoppingList.toast.title'),
          );
        },
        error: (err) => {
          console.error('Failed to add multiple shopping list items:', err);
          this.toastService.showError(this.transloco.translate('shoppingList.toast.addManyFailed'));
        },
      });
  }

  updateItemPrice(id: string, price: number): void {
    this.updateItem(id, { estimatedPrice: price }).subscribe({
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
    this.updateItem(id, { quantity: qty }).subscribe({
      next: (updated) => {
        this.itemsSignal.update((curr) => curr.map((item) => (item.id === id ? updated : item)));
      },
      error: (err) => {
        console.error('Failed to update item quantity:', err);
      },
    });
  }

  updateItem(id: string, patch: Partial<ShoppingItem>): Observable<ShoppingItem> {
    return this.http
      .put<ApiResponse<ShoppingItem>>(`${this.apiUrl}/${id}`, patch)
      .pipe(mapResponseData<ShoppingItem>());
  }

  markBought(ids: string[]): Observable<{ count: number }> {
    return this.http
      .put<ApiResponse<{ count: number }>>(`${this.apiUrl}/bulk`, { ids, checked: true })
      .pipe(mapResponseData<{ count: number }>());
  }

  deleteItems(ids: string[]): Observable<{ count: number }> {
    return this.http
      .delete<ApiResponse<{ count: number }>>(`${this.apiUrl}/bulk`, { body: { ids } })
      .pipe(mapResponseData<{ count: number }>());
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
            this.toastService.showInfo(
              this.transloco.translate('shoppingList.toast.removed', { name: item.name }),
            );
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
          this.toastService.showInfo(
            this.transloco.translate('shoppingList.toast.cleared', { count }),
          );
        },
        error: (err) => {
          console.error('Failed to clear checked shopping list items:', err);
        },
      });
  }

  restockCheckedItems(): void {
    const checkedItems = this.itemsSignal().filter((i) => i.checked);
    if (checkedItems.length === 0) {
      this.toastService.showWarning(
        this.transloco.translate('shoppingList.toast.nothingToRestock'),
      );
      return;
    }

    this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/checked`)
      .pipe(mapResponseData<unknown>())
      .subscribe({
        next: () => {
          this.itemsSignal.update((curr) => curr.filter((i) => !i.checked));
          this.toastService.showSuccess(
            this.transloco.translate('shoppingList.toast.restocked', {
              count: checkedItems.length,
            }),
            this.transloco.translate('shoppingList.toast.restockedTitle'),
          );
        },
        error: (err) => {
          console.error('Failed to restock checked items:', err);
        },
      });
  }
}
