import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Recipe, RecipeIngredientDTO } from '@models/recipe.model';
import { Unit } from '@models/unit.model';

@Component({
  selector: 'pantry-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCardComponent {
  @Input() recipe: Recipe = {} as Recipe;
  @Input() ingredientMap = new Map<string, Ingredient>();
  @Input() unitMap = new Map<number, Unit>();
  @Input() availableBaseMap = new Map<string, number>();
  @Input() pantryItems: Item[] = [];

  private isKnownTime(value: number | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  get totalTime(): number | null {
    const { prepTime, cookTime } = this.recipe;
    return this.isKnownTime(prepTime) && this.isKnownTime(cookTime) ? prepTime + cookTime : null;
  }

  get timeSummary(): { key: string; count: number | null } {
    if (this.totalTime !== null)
      return { key: 'recipes.browse.totalMinutes', count: this.totalTime };
    if (this.isKnownTime(this.recipe.prepTime)) {
      return { key: 'recipes.browse.prepMinutes', count: this.recipe.prepTime };
    }
    if (this.isKnownTime(this.recipe.cookTime)) {
      return { key: 'recipes.browse.cookMinutes', count: this.recipe.cookTime };
    }
    return { key: 'recipes.browse.timeNotSet', count: null };
  }

  get difficultyKey(): string | null {
    const labelKeys: Record<string, string> = {
      easy: 'recipes.browse.difficultyEasy',
      medium: 'recipes.browse.difficultyMedium',
      hard: 'recipes.browse.difficultyHard',
    };
    const knownLabel = labelKeys[this.recipe.difficulty?.trim().toLowerCase() || ''];
    if (knownLabel) return knownLabel;
    switch (this.recipe.difficultyId) {
      case 1:
        return labelKeys['easy'];
      case 2:
        return labelKeys['medium'];
      case 3:
        return labelKeys['hard'];
      default:
        return null;
    }
  }

  getIngredientAvailability(ing: RecipeIngredientDTO): { isAvailable: boolean } {
    const unit = ing.unitId ? this.unitMap.get(ing.unitId) : null;
    const factor = unit?.toBaseFactor || 1;
    const requiredBase = ing.quantity * factor;
    const availableBase = this.availableBaseMap.get(ing.ingredientId) || 0;
    return { isAvailable: availableBase >= requiredBase - 1e-6 };
  }

  get ingredientStats(): {
    availableCount: number;
    totalCount: number;
    percentage: number;
    isFullyMakeable: boolean;
  } {
    const ingredients = this.recipe.ingredients || [];
    const availableCount = ingredients.filter(
      (ing) => this.getIngredientAvailability(ing).isAvailable,
    ).length;
    return {
      availableCount,
      totalCount: ingredients.length,
      percentage: ingredients.length
        ? Math.round((availableCount / ingredients.length) * 100)
        : 100,
      isFullyMakeable: availableCount === ingredients.length,
    };
  }

  get shortages(): {
    ingredientId: string;
    name: string;
    reason: 'absent' | 'insufficient' | 'expired';
  }[] {
    const now = new Date().getTime();
    return (this.recipe.ingredients || [])
      .filter((ing) => !this.getIngredientAvailability(ing).isAvailable)
      .map((ing) => {
        const available = this.availableBaseMap.get(ing.ingredientId) || 0;
        const expiredStock = this.pantryItems.some(
          (item) =>
            item.ingredientId === ing.ingredientId &&
            item.quantity > 0 &&
            item.expirationDate &&
            new Date(item.expirationDate).getTime() < now,
        );
        const reason: 'absent' | 'insufficient' | 'expired' =
          available > 0 ? 'insufficient' : expiredStock ? 'expired' : 'absent';
        return {
          ingredientId: ing.ingredientId,
          name: this.ingredientMap.get(ing.ingredientId)?.name || ing.ingredientId,
          reason,
        };
      });
  }
}
