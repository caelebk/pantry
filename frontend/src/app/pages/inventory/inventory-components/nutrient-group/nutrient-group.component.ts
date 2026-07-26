import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IngredientCategoryCluster } from '@models/inventory.models';
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
  nutrientGroup!: IngredientCategoryCluster;

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

  get categoryClusters() {
    return this.nutrientGroup?.ingredientGroups || this.nutrientGroup?.categoryGroups || [];
  }

  get totalItemsCount(): number {
    if (!this.categoryClusters) return 0;
    return this.categoryClusters.reduce((acc: number, catGroup: any) => {
      return (
        acc + (catGroup.ingredients?.reduce((ingAcc: number, ing: any) => ingAcc + (ing.itemCount || 0), 0) || 0)
      );
    }, 0);
  }

  get totalIngredientsCount(): number {
    if (!this.categoryClusters) return 0;
    return this.categoryClusters.reduce((acc: number, catGroup: any) => {
      return acc + (catGroup.ingredients?.length || 0);
    }, 0);
  }

  get inStockIngredientsCount(): number {
    if (!this.categoryClusters) return 0;
    return this.categoryClusters.reduce((acc: number, catGroup: any) => {
      return acc + (catGroup.ingredients?.filter((ing: any) => ing.itemCount > 0).length || 0);
    }, 0);
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories.has(categoryId);
  }

  onToggleNutrientGroup() {
    const cat = this.nutrientGroup.category || this.nutrientGroup.nutrientType;
    if (cat) {
      this.toggleNutrientGroup.emit(cat.id);
    }
  }

  onToggleCategory(categoryId: number) {
    this.toggleCategory.emit(categoryId);
  }

  onToggleIngredient(ingredientId: string) {
    this.toggleIngredient.emit(ingredientId);
  }
}
