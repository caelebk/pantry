import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DayOfWeek, MealType } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { EmptyStateComponent, SkeletonComponent } from '@ui';
import { DailyFocusComponent } from './daily-focus/daily-focus.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';

export type PlannerSubTab = 'calendar' | 'daily';

@Component({
  selector: 'pantry-meal-planner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    WeeklyViewComponent,
    DailyFocusComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPlannerComponent implements OnInit {
  private readonly router = inject(Router);
  readonly mealPlannerService = inject(MealPlannerService);

  readonly days = this.mealPlannerService.days;
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Active Sub-Page View Tab
  activeSubTab = signal<PlannerSubTab>('calendar');

  // Modal / Add Plan State
  isAddModalOpen = signal<boolean>(false);
  selectedDay = signal<DayOfWeek>('Monday');
  selectedMealType = signal<MealType>('Dinner');

  readonly plannedMeals = computed(() => this.mealPlannerService.meals());
  readonly cookedCount = computed(() => this.plannedMeals().filter((m) => m.cooked).length);
  readonly totalPlannedCount = computed(() => this.plannedMeals().length);
  readonly missingItemsCount = computed(
    () => this.mealPlannerService.uniqueMissingIngredients().length,
  );

  ngOnInit(): void {
    // Stock changes outside this page, so refresh it on every visit.
    this.mealPlannerService.loadStock();
  }

  setSubTab(tab: PlannerSubTab): void {
    this.activeSubTab.set(tab);
  }

  openAddModal(eventPayload?: { day: DayOfWeek; mealType: MealType }): void {
    if (eventPayload) {
      this.router.navigate(['/meal-planner/new'], {
        queryParams: { day: eventPayload.day, type: eventPayload.mealType },
      });
    } else {
      this.router.navigate(['/meal-planner/new']);
    }
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  retryLoadStock(): void {
    this.mealPlannerService.loadStock();
  }

  syncAllMissingToShoppingList(): void {
    this.mealPlannerService.addAllMissingToShoppingList();
  }
}
