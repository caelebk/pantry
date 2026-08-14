import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IngredientCategoryCluster } from '@models/inventory.models';
import { Item } from '@models/items.model';
import { IngredientGroupComponent } from '../ingredient-group/ingredient-group.component';

@Component({
  selector: 'pantry-ingredient-category',
  standalone: true,
  imports: [CommonModule, IngredientGroupComponent],
  templateUrl: './ingredient-category.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientCategoryComponent {
  @Input({ required: true })
  nutrientGroup!: IngredientCategoryCluster;

  @Input({ required: true })
  isExpanded!: boolean;

  @Input()
  expandedCategories = new Set<number>();

  @Input()
  expandedIngredients = new Set<string>();

  @Output()
  toggleNutrientGroup = new EventEmitter<number>();

  @Output()
  toggleCategory = new EventEmitter<number>();

  @Output()
  toggleIngredient = new EventEmitter<string>();

  @Output()
  unassignItem = new EventEmitter<Item>();

  get nutrientType() {
    return (
      this.nutrientGroup?.category ||
      this.nutrientGroup?.nutrientType || {
        id: -1,
        name: 'Unclassified',
        icon: '📦',
        color: '#94a3b8',
        description: 'Categories without an assigned ingredient category',
      }
    );
  }

  get categoryClusters() {
    return this.nutrientGroup?.ingredientGroups || this.nutrientGroup?.categoryGroups || [];
  }

  get categoryGroups() {
    return this.categoryClusters;
  }

  getGroupCategoryId(group: { group?: { id: number }; category?: { id: number } }): number {
    return group?.group?.id ?? group?.category?.id ?? -1;
  }

  get totalItemsCount(): number {
    if (!this.categoryClusters) return 0;
    return this.categoryClusters.reduce(
      (acc: number, catGroup: { ingredients?: { itemCount?: number }[] }) => {
        return (
          acc +
          (catGroup.ingredients?.reduce(
            (ingAcc: number, ing: { itemCount?: number }) => ingAcc + (ing.itemCount || 0),
            0,
          ) || 0)
        );
      },
      0,
    );
  }

  get totalIngredientsCount(): number {
    if (!this.categoryClusters) return 0;
    return this.categoryClusters.reduce((acc: number, catGroup: { ingredients?: unknown[] }) => {
      return acc + (catGroup.ingredients?.length || 0);
    }, 0);
  }

  get inStockIngredientsCount(): number {
    if (!this.categoryClusters) return 0;
    return this.categoryClusters.reduce(
      (acc: number, catGroup: { ingredients?: { itemCount: number }[] }) => {
        return (
          acc +
          (catGroup.ingredients?.filter((ing: { itemCount: number }) => ing.itemCount > 0).length ||
            0)
        );
      },
      0,
    );
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories.has(categoryId);
  }

  onToggleNutrientGroup() {
    const cat = this.nutrientType;
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
