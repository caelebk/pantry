import { NgTemplateOutlet } from '@angular/common';
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
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { CardComponent } from '@ui';

const DAYS_BY_JS_INDEX: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Component({
  selector: 'pantry-weekly-view',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, TranslocoModule, CardComponent],
  templateUrl: './weekly-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyViewComponent {
  readonly mealPlannerService = inject(MealPlannerService);

  readonly mealsInput = signal<PlannedMeal[]>([]);

  @Input() set meals(val: PlannedMeal[]) {
    this.mealsInput.set(val || []);
  }
  get meals(): PlannedMeal[] {
    return this.mealsInput();
  }

  @Output() addMealRequested = new EventEmitter<{ day: DayOfWeek; mealType?: MealType }>();

  readonly days = this.mealPlannerService.days;
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  /** The current weekday. Set it to override the clock, for example in tests. */
  readonly today = signal<DayOfWeek>(DAYS_BY_JS_INDEX[new Date().getDay()]);

  readonly mealsBySlotMap = computed(() => {
    const map = new Map<string, PlannedMeal[]>();
    for (const m of this.mealsInput()) {
      const key = `${m.day}_${m.mealType}`;
      const list = map.get(key) || [];
      list.push(m);
      map.set(key, list);
    }
    return map;
  });

  readonly mealsByDayMap = computed(() => {
    const map = new Map<DayOfWeek, PlannedMeal[]>();
    for (const m of this.mealsInput()) {
      const list = map.get(m.day) || [];
      list.push(m);
      map.set(m.day, list);
    }
    return map;
  });

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.mealsByDayMap().get(day) || [];
  }

  getMealsForSlot(day: DayOfWeek, mealType: MealType): PlannedMeal[] {
    return this.mealsBySlotMap().get(`${day}_${mealType}`) || [];
  }

  onRequestAdd(day: DayOfWeek, mealType?: MealType): void {
    this.addMealRequested.emit({ day, mealType });
  }

  toggleCooked(id: string): void {
    this.mealPlannerService.toggleCooked(id);
  }

  removeMeal(id: string): void {
    this.mealPlannerService.removeMealPlan(id);
  }

  missingFor(meal: PlannedMeal): string[] | null {
    return this.mealPlannerService.missingFor(meal);
  }
}
