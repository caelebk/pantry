import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Router } from "@angular/router";
import { IngredientGroup } from "@models/inventory.models";
import { IngredientRowComponent } from "../ingredient-row/ingredient-row.component";

import { Item } from "@models/items.model";

@Component({
  selector: "pantry-ingredient-group",
  standalone: true,
  imports: [CommonModule, IngredientRowComponent],
  templateUrl: "./ingredient-group.component.html",
})
export class IngredientGroupComponent {
  private readonly router = inject(Router);

  @Input({ required: true })
  group!: IngredientGroup;
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

  onUnassign(item: Item, event: Event) {
    event.stopPropagation();
    this.unassignItem.emit(item);
  }

  navigateToEdit(itemId: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/inventory', itemId, 'edit']);
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

  isIngredientExpanded(id: string): boolean {
    return this.expandedIngredients.has(id);
  }

  onToggleIngredient(id: string) {
    this.toggleIngredient.emit(id);
  }
}
