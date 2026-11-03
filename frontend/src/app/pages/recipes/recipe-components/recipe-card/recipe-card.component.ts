import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Recipe, RecipeIngredientDTO } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import {
  isIngredientAvailable,
  RecipeAvailability,
  recipeAvailability,
  RecipeShortage,
  recipeShortages,
} from '@utility/recipe-stock';

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
    return { isAvailable: isIngredientAvailable(ing, this.unitMap, this.availableBaseMap) };
  }

  get ingredientStats(): RecipeAvailability {
    return recipeAvailability(this.recipe.ingredients || [], this.unitMap, this.availableBaseMap);
  }

  get shortages(): RecipeShortage[] {
    return recipeShortages(
      this.recipe.ingredients || [],
      this.pantryItems,
      this.unitMap,
      this.ingredientMap,
      this.availableBaseMap,
    );
  }
}
