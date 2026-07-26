import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShoppingListService } from '@services/shopping-list.service';

@Component({
  selector: 'pantry-add-shopping-item-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-item-page.component.html',
  styleUrl: './add-item-page.component.scss',
})
export class AddShoppingItemPageComponent {
  private readonly router = inject(Router);
  private readonly shoppingListService = inject(ShoppingListService);

  readonly categories = ['Produce', 'Dairy', 'Meat & Seafood', 'Pantry', 'Bakery', 'Beverage', 'Frozen', 'General'];
  readonly units = ['pcs', 'kg', 'g', 'lbs', 'oz', 'bottle', 'can', 'pack', 'heads', 'bunch', 'ml', 'carton', 'wedge'];

  name = signal<string>('');
  category = signal<string>('Produce');
  quantity = signal<number>(1);
  unit = signal<string>('pcs');
  estimatedPrice = signal<number | null>(null);
  storeName = signal<string>('');

  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  decrementQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  saveItem(): void {
    const itemName = this.name().trim();
    if (!itemName) return;

    this.shoppingListService.addItem({
      name: itemName,
      category: this.category(),
      quantity: this.quantity() || 1,
      unit: this.unit(),
      estimatedPrice: this.estimatedPrice() || 0,
      storeName: this.storeName().trim(),
      source: 'manual',
    });

    this.goBack();
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
