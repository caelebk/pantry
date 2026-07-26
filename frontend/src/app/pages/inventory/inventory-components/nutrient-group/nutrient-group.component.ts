import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NutrientGroup } from '@models/inventory.models';
import { Item } from '@models/items.model';
import { IngredientGroupComponent } from '../ingredient-group/ingredient-group.component';

@Component({
  selector: 'pantry-nutrient-group',
  standalone: true,
  imports: [CommonModule, IngredientGroupComponent],
  templateUrl: './nutrient-group.component.html',
})
export class NutrientGroupComponent {
  @Input({ required: true })
  nutrientGroup!: NutrientGroup;

  @Input({ required: true })
  isExpanded!: boolean;

  @Input()
  expandedCategories: Set<number> = new Set();

  @Input()
  expandedIngredients: Set<string> = new Set();

  @Output()
  toggleNutrientGroup = new EventEmitter<number>();

  @Output()
  toggleCategory = new EventEmitter<number>();

  @Output()
  toggleIngredient = new EventEmitter<string>();

  @Output()
  unassignItem = new EventEmitter<Item>();

  get totalItemsCount(): number {
    if (!this.nutrientGroup?.categoryGroups) return 0;
    return this.nutrientGroup.categoryGroups.reduce((acc, catGroup) => {
      return (
        acc + (catGroup.ingredients?.reduce((ingAcc, ing) => ingAcc + (ing.itemCount || 0), 0) || 0)
      );
    }, 0);
  }

  get totalIngredientsCount(): number {
    if (!this.nutrientGroup?.categoryGroups) return 0;
    return this.nutrientGroup.categoryGroups.reduce((acc, catGroup) => {
      return acc + (catGroup.ingredients?.length || 0);
    }, 0);
  }

  get inStockIngredientsCount(): number {
    if (!this.nutrientGroup?.categoryGroups) return 0;
    return this.nutrientGroup.categoryGroups.reduce((acc, catGroup) => {
      return acc + (catGroup.ingredients?.filter((ing) => ing.itemCount > 0).length || 0);
    }, 0);
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories.has(categoryId);
  }

  onToggleNutrientGroup() {
    this.toggleNutrientGroup.emit(this.nutrientGroup.nutrientType.id);
  }

  onToggleCategory(categoryId: number) {
    this.toggleCategory.emit(categoryId);
  }

  onToggleIngredient(ingredientId: string) {
    this.toggleIngredient.emit(ingredientId);
  }
}
