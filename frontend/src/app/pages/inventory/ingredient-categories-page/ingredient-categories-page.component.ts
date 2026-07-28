import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { ToastService } from '@services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'pantry-ingredient-categories-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredient-categories-page.component.html',
})
export class IngredientCategoriesPageComponent implements OnInit {
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly toastService = inject(ToastService);

  public ingredientCategories = signal<IngredientCategory[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public isLoading = signal<boolean>(true);

  ngOnInit(): void {
    forkJoin({
      ingredientCategories: this.ingredientCategoryService.getIngredientCategories(),
      ingredientGroups: this.ingredientGroupService.getIngredientGroups(),
    }).subscribe({
      next: ({ ingredientCategories, ingredientGroups }) => {
        this.ingredientCategories.set(ingredientCategories);
        this.ingredientGroups.set(ingredientGroups);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching ingredient categories page data:', err);
        this.toastService.showError('Failed to load ingredient categories.');
        this.isLoading.set(false);
      },
    });
  }

  public getGroupsForIngredientCategory(categoryId: number): IngredientGroup[] {
    return this.ingredientGroups().filter(
      (ig) => (ig.ingredientCategoryId ?? ig.nutrientGroupId) === categoryId,
    );
  }
}
