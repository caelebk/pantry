import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IngredientGroupCluster } from '@models/inventory.models';

import { Item } from '@models/items.model';

@Component({
  selector: 'pantry-ingredient-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-group.component.html',
})
export class IngredientGroupComponent {
  private readonly router = inject(Router);

  @Input({ required: true })
  group!: IngredientGroupCluster;
  @Input({ required: true })
  isExpanded!: boolean;
  @Input()
  expandedIngredients: Set<string> = new Set();

  @Output()
  toggle = new EventEmitter<number>();
  @Output()
  toggleIngredient = new EventEmitter<string>();
  @Output()
  unassignItem = new EventEmitter<Item>();

  get category() {
    return this.group?.group || this.group?.category || { id: -1, name: 'Uncategorized' };
  }

  onToggle() {
    this.toggle.emit(this.category.id);
  }

  onUnassign(item: Item, event: Event) {
    event.stopPropagation();
    this.unassignItem.emit(item);
  }

  navigateToEdit(itemId: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/inventory', itemId, 'edit']);
  }

  onAddIngredient(event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/inventory/ingredients/new']);
  }

  get totalItemsCount(): number {
    if (!this.group || !this.group.ingredients) return 0;
    return this.group.ingredients.reduce((acc, ing) => acc + (ing.itemCount || 0), 0);
  }

  get inStockCount(): number {
    if (!this.group || !this.group.ingredients) return 0;
    return this.group.ingredients.filter((ing) => ing.itemCount > 0).length;
  }

  isExpired(expirationDate: string | Date | undefined): boolean {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  }

  isExpiringSoon(expirationDate: string | Date | undefined): boolean {
    if (!expirationDate) return false;
    const exp = new Date(expirationDate);
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return exp >= now && exp.getTime() - now.getTime() <= threeDays;
  }

  getIngredientQuantitySummary(ingredient: any): string {
    if (!ingredient || !ingredient.items || ingredient.items.length === 0) return '—';
    return ingredient.items.map((i: Item) => `${i.quantity} ${i.unit?.shortName || ''}`).join(', ');
  }

  isIngredientExpanded(id: string): boolean {
    return this.expandedIngredients.has(id);
  }

  onToggleIngredient(id: string) {
    this.toggleIngredient.emit(id);
  }
}
