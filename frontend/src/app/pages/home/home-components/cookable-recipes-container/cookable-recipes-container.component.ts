import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';

@Component({
  selector: 'pantry-cookable-recipes-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './cookable-recipes-container.component.html',
  host: { class: 'block' },
})
export class CookableRecipesContainerComponent {
  private readonly router = inject(Router);

  recipes = input<Recipe[]>([]);

  onViewRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }

  onBrowseAllRecipes(): void {
    this.router.navigate(['/recipes']);
  }
}
