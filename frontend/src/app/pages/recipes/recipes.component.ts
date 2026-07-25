import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';
import { RecipeService } from '../../services/recipe.service';
import { RecipeCardComponent } from './recipe-components/recipe-card/recipe-card.component';

@Component({
  selector: 'pantry-recipes',
  standalone: true,
  imports: [CommonModule, TranslocoModule, RecipeCardComponent],
  templateUrl: './recipes.component.html',
})
export class RecipesComponent implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly router = inject(Router);

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

  goToCreateRecipe(): void {
    this.router.navigate(['/recipes/new']);
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
