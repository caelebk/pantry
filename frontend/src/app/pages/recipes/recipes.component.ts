import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { SelectModule } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IngredientService } from '../../services/inventory/ingredient.service';
import { ItemService } from '../../services/inventory/item.service';
import { UnitService } from '../../services/inventory/unit.service';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { RecipeCardComponent } from './recipe-components/recipe-card/recipe-card.component';

export type RecipeSortOption =
  | 'availability'
  | 'priority'
  | 'time-asc'
  | 'time-desc'
  | 'difficulty-asc'
  | 'difficulty-desc'
  | 'name-asc';

export type AvailabilityFilterOption = 'all' | 'makeable' | 'partial';
export type DifficultyFilterOption = 'all' | 'easy' | 'medium' | 'hard';

import { ChangeDetectionStrategy } from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'pantry-recipes',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    FormsModule,
    RecipeCardComponent,
    SelectModule,
    SkeletonModule,
  ],
  templateUrl: './recipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipesComponent {
  private readonly recipeService = inject(RecipeService);
  private readonly itemService = inject(ItemService);
  private readonly unitService = inject(UnitService);
  private readonly ingredientService = inject(IngredientService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.loadData();
      }
    });
  }

  recipes: Recipe[] = [];
  pantryItems: Item[] = [];
  units: Unit[] = [];
  ingredients: Ingredient[] = [];

  unitMap = new Map<number, Unit>();
  ingredientMap = new Map<string, Ingredient>();
  availableBaseMap = new Map<string, number>();

  isLoading = false;

  // Filter & Sort Controls
  searchQuery = '';
  sortBy: RecipeSortOption = 'availability';
  availabilityFilter: AvailabilityFilterOption = 'all';
  difficultyFilter: DifficultyFilterOption = 'all';
  maxTimeFilter = 0; // 0 means any time

  sortOptions: { label: string; value: RecipeSortOption; icon: string }[] = [
    { label: 'Available', value: 'availability', icon: '✨' },
    { label: 'Priority', value: 'priority', icon: '⏳' },
    { label: 'Quickest', value: 'time-asc', icon: '⚡' },
    { label: 'Longest', value: 'time-desc', icon: '⏳' },
    { label: 'Easy First', value: 'difficulty-asc', icon: '🟢' },
    { label: 'Hard First', value: 'difficulty-desc', icon: '🔴' },
    { label: 'Name (A-Z)', value: 'name-asc', icon: '🔤' },
  ];

  difficultyOptions: { label: string; value: DifficultyFilterOption }[] = [
    { label: 'All', value: 'all' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

  timeOptions: { label: string; value: number }[] = [
    { label: 'Any', value: 0 },
    { label: '< 15m', value: 15 },
    { label: '< 30m', value: 30 },
    { label: '< 60m', value: 60 },
  ];

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      recipes: this.recipeService.getRecipes(),
      items: this.itemService.getItems(),
      units: this.unitService.getUnits(),
      ingredients: this.ingredientService.getIngredients(),
    }).subscribe({
      next: ({ recipes, items, units, ingredients }) => {
        this.recipes = recipes;
        this.pantryItems = items;
        this.units = units;
        this.ingredients = ingredients;

        this.unitMap = new Map(units.map((u) => [u.id, u]));
        this.ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));
        this.buildAvailableBaseMap();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load recipe data', err);
        this.isLoading = false;
        this.cdr.markForCheck();
        this.toastService.showError('Unable to load recipe data.', 'Network Error');
      },
    });
  }

  private buildAvailableBaseMap(): void {
    const map = new Map<string, number>();
    const now = new Date();
    for (const item of this.pantryItems) {
      if (item.ingredientId) {
        if (item.expirationDate && new Date(item.expirationDate) < now) {
          continue; // skip expired items
        }
        const factor = item.unit?.toBaseFactor || 1;
        const baseQty = item.quantity * factor;
        map.set(item.ingredientId, (map.get(item.ingredientId) || 0) + baseQty);
      }
    }
    this.availableBaseMap = map;
  }

  getRecipeAvailability(recipe: Recipe): {
    availableCount: number;
    totalCount: number;
    percentage: number;
    isFullyMakeable: boolean;
  } {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return { availableCount: 0, totalCount: 0, percentage: 100, isFullyMakeable: true };
    }
    let availableCount = 0;
    for (const ing of recipe.ingredients) {
      const unit = ing.unitId ? this.unitMap.get(ing.unitId) : null;
      const factor = unit?.toBaseFactor || 1;
      const requiredBase = ing.quantity * factor;
      const availableBase = this.availableBaseMap.get(ing.ingredientId) || 0;
      if (availableBase >= requiredBase - 1e-6) {
        availableCount++;
      }
    }
    const totalCount = recipe.ingredients.length;
    const percentage = Math.round((availableCount / totalCount) * 100);
    return {
      availableCount,
      totalCount,
      percentage,
      isFullyMakeable: availableCount === totalCount,
    };
  }

  getRecipePriorityScore(recipe: Recipe): {
    score: number;
    minDays: number;
    expiringCount: number;
  } {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return { score: 0, minDays: 999, expiringCount: 0 };
    }

    const now = new Date();
    let minDays = 999;
    let expiringCount = 0;
    let scoreSum = 0;

    for (const ing of recipe.ingredients) {
      const matchingItems = this.pantryItems.filter(
        (item) => item.ingredientId === ing.ingredientId && item.expirationDate,
      );

      for (const item of matchingItems) {
        if (!item.expirationDate) continue;
        const exp = new Date(item.expirationDate);
        const diffMs = exp.getTime() - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (days <= 7) {
          expiringCount++;
          if (days < minDays) {
            minDays = days;
          }
          const itemScore = Math.max(10, 100 - Math.max(0, days) * 10);
          scoreSum += itemScore;
        }
      }
    }

    if (expiringCount === 0) {
      return { score: 0, minDays: 999, expiringCount: 0 };
    }

    const urgencyWeight = Math.max(0, 14 - Math.max(0, minDays)) * 100;
    const totalScore = urgencyWeight + scoreSum;

    return { score: totalScore, minDays, expiringCount };
  }

  getDifficultyValue(recipe: Recipe): number {
    if (recipe.difficultyId) return recipe.difficultyId;
    const text = (recipe.difficulty || '').toLowerCase();
    if (text.includes('easy')) return 1;
    if (text.includes('medium')) return 2;
    if (text.includes('hard')) return 3;
    return 1;
  }

  getTotalTime(recipe: Recipe): number {
    return (recipe.prepTime || 0) + (recipe.cookTime || 0);
  }

  get filteredRecipes(): Recipe[] {
    let list = [...this.recipes];

    // 1. Search filter
    const term = this.searchQuery.toLowerCase().trim();
    if (term) {
      list = list.filter((r) => {
        const nameMatch = r.name.toLowerCase().includes(term);
        const descMatch = r.description?.toLowerCase().includes(term);
        const ingMatch = r.ingredients?.some((ing) => {
          const ingName = this.ingredientMap.get(ing.ingredientId)?.name.toLowerCase() || '';
          return ingName.includes(term);
        });
        return nameMatch || descMatch || ingMatch;
      });
    }

    // 2. Availability filter
    if (this.availabilityFilter === 'makeable') {
      list = list.filter((r) => this.getRecipeAvailability(r).isFullyMakeable);
    } else if (this.availabilityFilter === 'partial') {
      list = list.filter((r) => !this.getRecipeAvailability(r).isFullyMakeable);
    }

    // 3. Difficulty filter
    if (this.difficultyFilter !== 'all') {
      list = list.filter((r) => {
        const val = this.getDifficultyValue(r);
        if (this.difficultyFilter === 'easy') return val === 1;
        if (this.difficultyFilter === 'medium') return val === 2;
        if (this.difficultyFilter === 'hard') return val === 3;
        return true;
      });
    }

    // 4. Max time filter
    if (this.maxTimeFilter > 0) {
      list = list.filter((r) => this.getTotalTime(r) <= this.maxTimeFilter);
    }

    // 5. Sorting
    return list.sort((a, b) => {
      switch (this.sortBy) {
        case 'priority': {
          const scoreA = this.getRecipePriorityScore(a).score;
          const scoreB = this.getRecipePriorityScore(b).score;
          if (scoreB !== scoreA) return scoreB - scoreA;
          const availA = this.getRecipeAvailability(a).isFullyMakeable ? 1 : 0;
          const availB = this.getRecipeAvailability(b).isFullyMakeable ? 1 : 0;
          if (availB !== availA) return availB - availA;
          return a.name.localeCompare(b.name);
        }
        case 'availability': {
          const availA = this.getRecipeAvailability(a);
          const availB = this.getRecipeAvailability(b);
          if (availA.isFullyMakeable !== availB.isFullyMakeable) {
            return availB.isFullyMakeable ? 1 : -1;
          }
          if (availB.percentage !== availA.percentage) {
            return availB.percentage - availA.percentage;
          }
          return a.name.localeCompare(b.name);
        }
        case 'time-asc': {
          const timeA = this.getTotalTime(a);
          const timeB = this.getTotalTime(b);
          if (timeA !== timeB) return timeA - timeB;
          return a.name.localeCompare(b.name);
        }
        case 'time-desc': {
          const timeA = this.getTotalTime(a);
          const timeB = this.getTotalTime(b);
          if (timeB !== timeA) return timeB - timeA;
          return a.name.localeCompare(b.name);
        }
        case 'difficulty-asc': {
          const diffA = this.getDifficultyValue(a);
          const diffB = this.getDifficultyValue(b);
          if (diffA !== diffB) return diffA - diffB;
          return a.name.localeCompare(b.name);
        }
        case 'difficulty-desc': {
          const diffA = this.getDifficultyValue(a);
          const diffB = this.getDifficultyValue(b);
          if (diffB !== diffA) return diffB - diffA;
          return a.name.localeCompare(b.name);
        }
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchQuery !== '' ||
      this.availabilityFilter !== 'all' ||
      this.difficultyFilter !== 'all' ||
      this.maxTimeFilter > 0 ||
      this.sortBy !== 'availability'
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.sortBy = 'availability';
    this.availabilityFilter = 'all';
    this.difficultyFilter = 'all';
    this.maxTimeFilter = 0;
  }

  setAvailabilityFilter(mode: AvailabilityFilterOption): void {
    this.availabilityFilter = mode;
  }

  goToCreateRecipe(): void {
    this.router.navigate(['/recipes/new']);
  }

  onDeleteRecipe(id: string): void {
    this.recipeService.deleteRecipe(id).subscribe({
      next: () => {
        this.toastService.showSuccess('Recipe deleted successfully.', 'Recipe Deleted');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to delete recipe', err);
        this.toastService.showError('Failed to delete recipe. Please try again.', 'Error');
      },
    });
  }
}
