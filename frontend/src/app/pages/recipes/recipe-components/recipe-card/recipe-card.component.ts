import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { IngredientService } from '../../../../services/inventory/ingredient.service';
import { UnitService } from '../../../../services/inventory/unit.service';

@Component({
  selector: 'pantry-recipe-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './recipe-card.component.html',
  styles: [':host { display: block; }'],
})
export class RecipeCardComponent implements OnInit {
  @Input() recipe: Recipe = {} as Recipe;
  @Output() delete = new EventEmitter<string>();

  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);

  ingredientMap = new Map<string, Ingredient>();
  unitMap = new Map<number, Unit>();

  ngOnInit(): void {
    this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => {
        ingredients.forEach((ing) => this.ingredientMap.set(ing.id, ing));
      },
    });

    this.unitService.getUnits().subscribe({
      next: (units) => {
        units.forEach((u) => this.unitMap.set(u.id, u));
      },
    });
  }

  getIngredientDisplay(ing: { ingredientId: string; quantity: number; unitId?: number | null }): string {
    const ingredientName = this.ingredientMap.get(ing.ingredientId)?.name || ing.ingredientId;
    const unitName = ing.unitId ? (this.unitMap.get(ing.unitId)?.shortName || this.unitMap.get(ing.unitId)?.name || '') : '';
    return `${ing.quantity} ${unitName} ${ingredientName}`.trim();
  }

  onDelete(): void {
    if (confirm(`Are you sure you want to delete "${this.recipe.name}"?`)) {
      this.delete.emit(this.recipe.id);
    }
  }
}
