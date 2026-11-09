import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DayOfWeek, MealType } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import {
  EmptyStateComponent,
  SegmentedControlComponent,
  SegmentedOption,
  SkeletonComponent,
} from '@ui';
import { switchMap } from 'rxjs';
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
    SegmentedControlComponent,
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

  private readonly transloco = inject(TranslocoService);
  // Re-emits once the active language's translations are loaded, so computed labels refresh.
  private readonly translationsReady = toSignal(
    this.transloco.langChanges$.pipe(switchMap((lang) => this.transloco.load(lang))),
  );

  readonly subTabOptions = computed<SegmentedOption<PlannerSubTab>[]>(() => {
    this.translationsReady();
    return [
      { value: 'calendar', label: this.transloco.translate('mealPlanner.tabs.calendar') },
      { value: 'daily', label: this.transloco.translate('mealPlanner.tabs.daily') },
    ];
  });

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

  setSubTab(tab: PlannerSubTab | undefined): void {
    if (tab) this.activeSubTab.set(tab);
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
