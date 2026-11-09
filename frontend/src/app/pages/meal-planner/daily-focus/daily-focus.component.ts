import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DayOfWeek, PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { BadgeComponent, CardComponent, EmptyStateComponent } from '@ui';
import { sumKnownMetadata } from '@utility/recipe-metadata';
import { SelectModule } from 'primeng/select';
import { switchMap } from 'rxjs';

@Component({
  selector: 'pantry-daily-focus',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    SelectModule,
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
  ],
  templateUrl: './daily-focus.component.html',
  styleUrl: './daily-focus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyFocusComponent {
  readonly mealPlannerService = inject(MealPlannerService);

  readonly mealsInput = signal<PlannedMeal[]>([]);

  @Input() set initialDay(day: DayOfWeek) {
    if (day) this.selectedDay.set(day);
  }
  @Input() set meals(val: PlannedMeal[]) {
    this.mealsInput.set(val || []);
  }
  get meals(): PlannedMeal[] {
    return this.mealsInput();
  }

  @Output() addMealRequested = new EventEmitter<{
    day: DayOfWeek;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  }>();

  private readonly transloco = inject(TranslocoService);
  // Re-emits once the active language's translations are loaded, so computed labels refresh.
  private readonly translationsReady = toSignal(
    this.transloco.langChanges$.pipe(switchMap((lang) => this.transloco.load(lang))),
  );

  readonly days = this.mealPlannerService.days;
  readonly dayOptions = computed(() => {
    this.translationsReady();
    return this.days.map((day) => ({
      value: day,
      label: this.transloco.translate(`mealPlanner.days.${day.toLowerCase()}`),
    }));
  });
  readonly selectedDay = signal<DayOfWeek>('Monday');

  readonly dayMeals = computed(() => {
    return this.mealsInput().filter((m) => m.day === this.selectedDay());
  });

  readonly totalCalories = computed(() => {
    return sumKnownMetadata(this.dayMeals().map((meal) => meal.calories));
  });

  readonly totalPrepTime = computed(() => {
    return sumKnownMetadata(this.dayMeals().map((meal) => meal.prepTimeMinutes));
  });

  readonly stockKnown = computed(() => this.mealPlannerService.missingByMealId() !== null);

  readonly missingIngredients = computed(() => {
    const list: string[] = [];
    this.dayMeals().forEach((m) => {
      if (m.cooked) return;
      list.push(...(this.mealPlannerService.missingFor(m) ?? []));
    });
    return Array.from(new Set(list));
  });

  selectDay(day: DayOfWeek): void {
    this.selectedDay.set(day);
  }

  onRequestAdd(mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'): void {
    this.addMealRequested.emit({ day: this.selectedDay(), mealType });
  }

  toggleCooked(id: string): void {
    this.mealPlannerService.toggleCooked(id);
  }

  removeMeal(id: string): void {
    this.mealPlannerService.removeMealPlan(id);
  }

  /** Cooked meals need nothing more, matching the weekly view and the header sync count. */
  missingFor(meal: PlannedMeal): string[] | null {
    if (meal.cooked) return [];
    return this.mealPlannerService.missingFor(meal);
  }

  addMissingToShoppingList(meal: PlannedMeal): void {
    this.mealPlannerService.addMissingToShoppingList(meal);
  }
}
