import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DayOfWeek, MealType } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { EmptyStateComponent, SkeletonComponent } from '@ui';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';

@Component({
  selector: 'pantry-meal-planner',
  standalone: true,
  imports: [TranslocoModule, WeeklyViewComponent, SkeletonComponent, EmptyStateComponent],
  templateUrl: './meal-planner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPlannerComponent implements OnInit {
  private readonly router = inject(Router);
  readonly mealPlannerService = inject(MealPlannerService);

  readonly plannedMeals = computed(() => this.mealPlannerService.meals());
  readonly totalPlannedCount = computed(() => this.plannedMeals().length);
  readonly missingItemsCount = computed(
    () => this.mealPlannerService.uniqueMissingIngredients().length,
  );
  readonly stockKnown = computed(() => this.mealPlannerService.missingByMealId() !== null);
  readonly missingMealsCount = computed(
    () =>
      this.plannedMeals().filter(
        (meal) => !meal.cooked && (this.mealPlannerService.missingFor(meal)?.length ?? 0) > 0,
      ).length,
  );

  ngOnInit(): void {
    // Stock changes outside this page, so refresh it on every visit.
    this.mealPlannerService.loadStock();
  }

  openAddModal(eventPayload?: { day: DayOfWeek; mealType?: MealType }): void {
    if (eventPayload) {
      this.router.navigate(['/meal-planner/new'], {
        queryParams: eventPayload.mealType
          ? { day: eventPayload.day, type: eventPayload.mealType }
          : { day: eventPayload.day },
      });
    } else {
      this.router.navigate(['/meal-planner/new']);
    }
  }

  retryLoadStock(): void {
    this.mealPlannerService.loadStock();
  }

  syncAllMissingToShoppingList(): void {
    this.mealPlannerService.addAllMissingToShoppingList();
  }
}
