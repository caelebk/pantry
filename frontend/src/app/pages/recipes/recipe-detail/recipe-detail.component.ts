import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { IngredientService } from '../../../services/inventory/ingredient.service';
import { ItemService } from '../../../services/inventory/item.service';
import { UnitService } from '../../../services/inventory/unit.service';
import { RecipeService } from '../../../services/recipe.service';

import { SubstitutionSuggestion } from '@models/inventory.models';
import { Item } from '@models/items.model';

import { ChangeDetectionStrategy } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'pantry-recipe-detail',
  standalone: true,
  imports: [CommonModule, TranslocoModule, DialogModule],
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

  recipe: Recipe | null = null;
  isLoading = true;

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
      },
      error: (err) => {
        console.error('Failed to load substitutions', err);
        this.isLoadingSubstitutions = false;
      },
    });
  }

  closeSubstitutionModal(): void {
    this.activeSubstitutionIngredient = null;
    this.activeSubstitutionSuggestions = [];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/recipes']);
      return;
    }

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

    this.itemService.getItems().subscribe({
      next: (items) => {
        this.pantryItems = items;
        const map = new Map<string, number>();
        const now = new Date();
        for (const item of items) {
          if (item.ingredientId) {
            if (item.expirationDate && new Date(item.expirationDate) < now) {
              continue;
            }
            const factor = item.unit?.toBaseFactor || 1;
            const baseQty = item.quantity * factor;
            map.set(item.ingredientId, (map.get(item.ingredientId) || 0) + baseQty);
          }
        }
        this.availableBaseMap = map;
      },
    });

    this.loadRecipe(id);
  }

  onIngredientClick(event: Event, ing: { ingredientId: string }): void {
    event.stopPropagation();
    const ingredientObj = this.ingredientMap.get(ing.ingredientId);
    const ingredientName = ingredientObj?.name || ing.ingredientId;

    // Search pantry items matching ingredientId or ingredient name
    const matchingItems = this.pantryItems.filter(
      (item) =>
        item.ingredientId === ing.ingredientId ||
        (ingredientName && item.name.toLowerCase().includes(ingredientName.toLowerCase())),
    );

    if (matchingItems.length === 1) {
      // 1 item in inventory -> go directly to edit page
      this.router.navigate(['/inventory', matchingItems[0].id, 'edit']);
    } else {
      // Multiple or 0 items -> go to inventory search
      this.router.navigate(['/inventory'], { queryParams: { search: ingredientName } });
    }
  }

  loadRecipe(id: string): void {
    this.isLoading = true;
    this.recipeService.getRecipeById(id).subscribe({
      next: (r) => {
        this.recipe = r;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load recipe details', err);
        this.isLoading = false;
      },
    });
  }

  get difficultyText(): string {
    if (!this.recipe) return '';
    if (this.recipe.difficulty) return this.recipe.difficulty;
    switch (this.recipe.difficultyId) {
      case 1:
        return 'Easy';
      case 2:
        return 'Medium';
      case 3:
        return 'Hard';
      default:
        return 'Easy';
    }
  }

  get difficultyClass(): string {
    const text = this.difficultyText.toLowerCase();
    if (text.includes('easy')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (text.includes('medium')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
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
    const unit = ing.unitId ? this.unitMap.get(ing.unitId) : null;
    const factor = unit?.toBaseFactor || 1;
    const requiredBase = ing.quantity * factor;
    const availableBase = this.availableBaseMap.get(ing.ingredientId) || 0;
    return {
      isAvailable: availableBase >= requiredBase - 1e-6,
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
