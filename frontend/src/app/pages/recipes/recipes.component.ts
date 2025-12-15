import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AddRecipeFormComponent } from './recipe-components/add-recipe-form/add-recipe-form.component';
import { Recipe, RecipeCardComponent } from './recipe-components/recipe-card/recipe-card.component';

@Component({
  selector: 'pantry-recipes',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AddRecipeFormComponent, RecipeCardComponent],
  templateUrl: './recipes.component.html',
})
export class RecipesComponent {
  recipes: Recipe[] = [];
}
