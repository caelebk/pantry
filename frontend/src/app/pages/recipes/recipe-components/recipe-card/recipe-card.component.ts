import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { forkJoin } from 'rxjs';
import { IngredientService } from '../../../../services/inventory/ingredient.service';
import { ItemService } from '../../../../services/inventory/item.service';
import { UnitService } from '../../../../services/inventory/unit.service';

import { Item } from '@models/items.model';

import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'pantry-recipe-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './recipe-card.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeCardComponent implements OnInit {
  @Input() recipe: Recipe = {} as Recipe;
  @Output() delete = new EventEmitter<string>();

  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  ingredientMap = new Map<string, Ingredient>();
  unitMap = new Map<number, Unit>();
  availableBaseMap = new Map<string, number>();
  pantryItems: Item[] = [];

  ngOnInit(): void {
    forkJoin({
      ingredients: this.ingredientService.getIngredients(),
      units: this.unitService.getUnits(),
      items: this.itemService.getItems(),
    }).subscribe({
      next: ({ ingredients, units, items }) => {
        this.ingredientMap = new Map(ingredients.map((ing) => [ing.id, ing]));
        this.unitMap = new Map(units.map((u) => [u.id, u]));
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
        this.cdr.markForCheck();
      },
    });
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

  get difficultyText(): string {
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

  // Missing ingredients come FIRST in the list
  get sortedIngredients(): { ingredientId: string; quantity: number; unitId?: number | null }[] {
    if (!this.recipe.ingredients) return [];
    return [...this.recipe.ingredients].sort((a, b) => {
      const availA = this.getIngredientAvailability(a).isAvailable ? 1 : 0;
      const availB = this.getIngredientAvailability(b).isAvailable ? 1 : 0;
      return availA - availB; // 0 (Missing) comes BEFORE 1 (In Stock)
    });
  }

  get ingredientStats(): {
    availableCount: number;
    totalCount: number;
    percentage: number;
    isFullyMakeable: boolean;
  } {
    if (!this.recipe.ingredients || this.recipe.ingredients.length === 0) {
      return { availableCount: 0, totalCount: 0, percentage: 100, isFullyMakeable: true };
    }
    let availableCount = 0;
    for (const ing of this.recipe.ingredients) {
      if (this.getIngredientAvailability(ing).isAvailable) {
        availableCount++;
      }
    }
    const totalCount = this.recipe.ingredients.length;
    const percentage = Math.round((availableCount / totalCount) * 100);
    return {
      availableCount,
      totalCount,
      percentage,
      isFullyMakeable: availableCount === totalCount,
    };
  }

  getIngredientExpirationInfo(ing: { ingredientId: string }): {
    expiringSoon: boolean;
    minDays: number | null;
  } {
    if (!this.pantryItems || this.pantryItems.length === 0) {
      return { expiringSoon: false, minDays: null };
    }
    const now = new Date();
    const matchingItems = this.pantryItems.filter(
      (item) => item.ingredientId === ing.ingredientId && item.expirationDate,
    );

    let minDays: number | null = null;
    for (const item of matchingItems) {
      if (!item.expirationDate) continue;
      const exp = new Date(item.expirationDate);
      const diffMs = exp.getTime() - now.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (days <= 7) {
        if (minDays === null || days < minDays) {
          minDays = days;
        }
      }
    }

    return {
      expiringSoon: minDays !== null,
      minDays,
    };
  }

  get expiringIngredients(): { name: string; daysLeft: number }[] {
    if (
      !this.recipe.ingredients ||
      this.recipe.ingredients.length === 0 ||
      this.pantryItems.length === 0
    ) {
      return [];
    }
    const now = new Date();
    const result: { name: string; daysLeft: number }[] = [];
    const processedIngs = new Set<string>();

    for (const ing of this.recipe.ingredients) {
      if (processedIngs.has(ing.ingredientId)) continue;

      const matchingItems = this.pantryItems.filter(
        (item) => item.ingredientId === ing.ingredientId && item.expirationDate,
      );

      let minDays: number | null = null;
      for (const item of matchingItems) {
        if (!item.expirationDate) continue;
        const exp = new Date(item.expirationDate);
        const diffMs = exp.getTime() - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (days <= 7) {
          if (minDays === null || days < minDays) {
            minDays = days;
          }
        }
      }

      if (minDays !== null) {
        processedIngs.add(ing.ingredientId);
        const ingName = this.ingredientMap.get(ing.ingredientId)?.name || 'Ingredient';
        result.push({ name: ingName, daysLeft: minDays });
      }
    }

    return result.sort((a, b) => a.daysLeft - b.daysLeft);
  }

  viewDetails(): void {
    this.router.navigate(['/recipes', this.recipe.id]);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${this.recipe.name}"?`)) {
      this.delete.emit(this.recipe.id);
    }
  }
}
