import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { forkJoin } from 'rxjs';
import { IngredientService } from '../../../services/inventory/ingredient.service';
import { ItemService } from '../../../services/inventory/item.service';
import { UnitService } from '../../../services/inventory/unit.service';
import { RecipeService } from '../../../services/recipe.service';

import { SubstitutionSuggestion } from '@models/inventory.models';
import { Item } from '@models/items.model';
import { buildAvailableBaseMap, isIngredientAvailable } from '@utility/recipe-stock';

import { ChangeDetectionStrategy } from '@angular/core';
import { BadgeComponent, BadgeVariant, EmptyStateComponent, SpinnerComponent } from '@ui';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'pantry-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    DialogModule,
    SpinnerComponent,
    EmptyStateComponent,
    BadgeComponent,
  ],
  templateUrl: './recipe-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly itemService = inject(ItemService);

  private readonly cdr = inject(ChangeDetectorRef);

  recipe: Recipe | null = null;
  isLoading = true;
  loadFailed = false;

  ingredientMap = new Map<string, Ingredient>();
  unitMap = new Map<number, Unit>();
  availableBaseMap = new Map<string, number>();
  pantryItems: Item[] = [];

  activeSubstitutionIngredient: { ingredientId: string; name: string } | null = null;
  activeSubstitutionSuggestions: SubstitutionSuggestion[] = [];
  isLoadingSubstitutions = false;

  openSubstitutionModal(event: Event, ing: { ingredientId: string }): void {
    event.stopPropagation();
    const ingredientObj = this.ingredientMap.get(ing.ingredientId);
    const name = ingredientObj?.name || 'Ingredient';
    this.activeSubstitutionIngredient = { ingredientId: ing.ingredientId, name };
    this.isLoadingSubstitutions = true;
    this.activeSubstitutionSuggestions = [];

    this.ingredientService.getSubstitutions(ing.ingredientId).subscribe({
      next: (subs) => {
        this.activeSubstitutionSuggestions = subs;
        this.isLoadingSubstitutions = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load substitutions', err);
        this.isLoadingSubstitutions = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeSubstitutionModal(): void {
    this.activeSubstitutionIngredient = null;
    this.activeSubstitutionSuggestions = [];
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/recipes']);
      return;
    }

    this.load(id);
  }

  retryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  private load(id: string): void {
    this.isLoading = true;
    this.loadFailed = false;
    this.recipe = null;
    forkJoin({
      recipe: this.recipeService.getRecipeById(id),
      ingredients: this.ingredientService.getIngredients(),
      units: this.unitService.getUnits(),
      items: this.itemService.getItems(),
    }).subscribe({
      next: ({ recipe, ingredients, units, items }) => {
        this.recipe = recipe;
        this.ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));
        this.unitMap = new Map(units.map((u) => [u.id, u]));
        this.pantryItems = items;

        this.availableBaseMap = buildAvailableBaseMap(items);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load recipe details', err);
        // Only a missing or malformed recipe id is "not found"; anything else is a load error.
        this.loadFailed = !(
          err instanceof HttpErrorResponse &&
          (err.status === 404 || err.status === 400)
        );
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onIngredientClick(event: Event, ing: { ingredientId: string }): void {
    event.stopPropagation();
    this.router.navigate(['/inventory/ingredients', ing.ingredientId]);
  }

  get difficultyText(): string | null {
    if (!this.recipe) return null;
    if (this.recipe.difficulty) return this.recipe.difficulty;
    switch (this.recipe.difficultyId) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      default:
        return null;
    }
  }

  get difficultyVariant(): BadgeVariant {
    const text = (this.difficultyText ?? '').toLowerCase();
    if (text.includes('easy')) {
      return 'fresh';
    } else if (text.includes('medium')) {
      return 'expiring';
    } else {
      return 'expired';
    }
  }

  getIngredientDisplay(ing: {
    ingredientId: string;
    quantity: number;
    unitId?: number | null;
  }): string {
    const ingredientName = this.ingredientMap.get(ing.ingredientId)?.name || ing.ingredientId;
    const unitName = ing.unitId
      ? this.unitMap.get(ing.unitId)?.shortName || this.unitMap.get(ing.unitId)?.name || ''
      : '';
    return `${ing.quantity} ${unitName} ${ingredientName}`.trim();
  }

  getIngredientAvailability(ing: {
    ingredientId: string;
    quantity: number;
    unitId?: number | null;
  }): {
    isAvailable: boolean;
  } {
    return {
      isAvailable: isIngredientAvailable(ing, this.unitMap, this.availableBaseMap),
    };
  }

  get sortedIngredients(): { ingredientId: string; quantity: number; unitId?: number | null }[] {
    if (!this.recipe || !this.recipe.ingredients) return [];
    return [...this.recipe.ingredients].sort((a, b) => {
      const availA = this.getIngredientAvailability(a).isAvailable ? 1 : 0;
      const availB = this.getIngredientAvailability(b).isAvailable ? 1 : 0;
      return availA - availB; // Missing comes FIRST
    });
  }

  get totalTime(): number {
    if (!this.recipe) return 0;
    return (this.recipe.prepTime || 0) + (this.recipe.cookTime || 0);
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }

  goToEdit(): void {
    if (this.recipe) {
      this.router.navigate(['/recipes', this.recipe.id, 'edit']);
    }
  }

  deleteRecipe(): void {
    if (this.recipe && confirm(`Are you sure you want to delete "${this.recipe.name}"?`)) {
      this.recipeService.deleteRecipe(this.recipe.id).subscribe({
        next: () => this.router.navigate(['/recipes']),
        error: (err) => console.error('Failed to delete recipe', err),
      });
    }
  }
}
