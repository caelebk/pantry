import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShoppingItem } from '@models/shopping-list.model';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';

export interface RestockDraftItem {
  shoppingId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  expirationDate: string; // YYYY-MM-DD
  notes: string;
  included: boolean;
}

@Component({
  selector: 'pantry-restock-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restock-review-page.component.html',
  styleUrl: './restock-review-page.component.scss',
})
export class RestockReviewPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly toastService = inject(ToastService);

  readonly locations = ['Fridge', 'Freezer', 'Pantry Shelf', 'Spice Cabinet', 'Countertop'];
  readonly units = ['pcs', 'kg', 'g', 'lbs', 'oz', 'bottle', 'can', 'pack', 'heads', 'bunch', 'ml', 'carton', 'wedge'];

  draftItems = signal<RestockDraftItem[]>([]);

  ngOnInit(): void {
    const boughtItems = this.shoppingListService.items().filter((i) => i.checked);
    
    // If no bought items, default draft with remaining unchecked items or fallback
    const sourceItems: ShoppingItem[] = boughtItems.length > 0
      ? boughtItems
      : this.shoppingListService.items();

    const today = new Date();
    const defaultExp = new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0];

    const drafts: RestockDraftItem[] = sourceItems.map((item) => ({
      shoppingId: item.id,
      name: item.name,
      category: item.category || 'General',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      location: this.getDefaultLocationForCategory(item.category),
      expirationDate: defaultExp,
      notes: item.recipeName ? `For recipe: ${item.recipeName}` : '',
      included: true,
    }));

    this.draftItems.set(drafts);
  }

  getDefaultLocationForCategory(category: string): string {
    const cat = (category || '').toLowerCase();
    if (cat.includes('dairy') || cat.includes('produce') || cat.includes('meat') || cat.includes('seafood')) {
      return 'Fridge';
    }
    if (cat.includes('frozen')) {
      return 'Freezer';
    }
    return 'Pantry Shelf';
  }

  setExpirationPreset(draft: RestockDraftItem, daysToAdd: number): void {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    draft.expirationDate = d.toISOString().split('T')[0];
  }

  toggleAll(checked: boolean): void {
    this.draftItems.update((items) =>
      items.map((i) => ({ ...i, included: checked }))
    );
  }

  get selectedCount(): number {
    return this.draftItems().filter((i) => i.included).length;
  }

  confirmRestock(): void {
    const itemsToRestock = this.draftItems().filter((i) => i.included);
    if (itemsToRestock.length === 0) {
      this.toastService.showWarning('Please select at least one item to restock');
      return;
    }

    // Clear restocked items from shopping list signal
    itemsToRestock.forEach((item) => {
      this.shoppingListService.removeItem(item.shoppingId);
    });

    this.toastService.showSuccess(
      `Successfully restocked ${itemsToRestock.length} item(s) into your Pantry inventory!`,
      'Restock Complete'
    );

    this.router.navigate(['/inventory']);
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
