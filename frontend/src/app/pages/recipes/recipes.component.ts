import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { AddRecipeFormComponent } from './recipe-components/add-recipe-form/add-recipe-form.component';
import { RecipeCardComponent } from './recipe-components/recipe-card/recipe-card.component';

@Component({
  selector: 'pantry-recipes',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AddRecipeFormComponent, RecipeCardComponent],
  templateUrl: './recipes.component.html',
})
export class RecipesComponent implements OnInit {
  private readonly recipeService = inject(RecipeService);

  recipes: Recipe[] = [];
  isLoading = false;
  filterMode: 'all' | 'available' = 'all';

  ngOnInit(): void {
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.isLoading = true;
    const request$ =
      this.filterMode === 'available'
        ? this.recipeService.getAvailableRecipes()
        : this.recipeService.getRecipes();

    request$.subscribe({
      next: (res) => {
        this.recipes = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load recipes', err);
        this.isLoading = false;
      },
    });
  }

  setFilterMode(mode: 'all' | 'available'): void {
    if (this.filterMode !== mode) {
      this.filterMode = mode;
      this.loadRecipes();
    }
  }

  onDeleteRecipe(id: string): void {
    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {
        this.loadRecipes();
      },
      error: (err) => console.error('Failed to delete recipe', err),
    });
  }
}
