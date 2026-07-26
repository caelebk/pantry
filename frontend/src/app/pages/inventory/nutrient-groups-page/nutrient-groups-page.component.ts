import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { IngredientGroup } from '@models/ingredient-group.model';
import { NutrientGroup } from '@models/nutrient-type.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { NutrientTypeService } from '@services/inventory/nutrient-type.service';
import { ToastService } from '@services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'pantry-nutrient-groups-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nutrient-groups-page.component.html',
})
export class NutrientGroupsPageComponent implements OnInit {
  private readonly nutrientTypeService = inject(NutrientTypeService);
  private readonly categoryService = inject(CategoryService);
  private readonly toastService = inject(ToastService);

  public nutrientGroups = signal<NutrientGroup[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public isLoading = signal<boolean>(true);

  ngOnInit(): void {
    forkJoin({
      nutrientGroups: this.nutrientTypeService.getNutrientGroups(),
      ingredientGroups: this.categoryService.getIngredientGroups(),
    }).subscribe({
      next: ({ nutrientGroups, ingredientGroups }) => {
        this.nutrientGroups.set(nutrientGroups);
        this.ingredientGroups.set(ingredientGroups);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching nutrient groups page data:', err);
        this.toastService.showError('Failed to load nutrient groups.');
        this.isLoading.set(false);
      },
    });
  }

  public getCategoriesForNutrientGroup(nutrientGroupId: number): IngredientGroup[] {
    return this.ingredientGroups().filter((ig) => ig.nutrientGroupId === nutrientGroupId);
  }
}
