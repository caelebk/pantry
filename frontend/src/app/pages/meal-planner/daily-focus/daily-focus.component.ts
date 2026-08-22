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
import { DayOfWeek, PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { BadgeComponent } from '@ui';

@Component({
  selector: 'pantry-daily-focus',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
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

  readonly days = this.mealPlannerService.days;
  readonly selectedDay = signal<DayOfWeek>('Monday');

  readonly dayMeals = computed(() => {
    return this.mealsInput().filter((m) => m.day === this.selectedDay());
  });

  readonly totalCalories = computed(() => {
    return this.dayMeals().reduce((sum, m) => sum + (m.calories || 0), 0);
  });

  readonly totalPrepTime = computed(() => {
    return this.dayMeals().reduce((sum, m) => sum + (m.prepTimeMinutes || 0), 0);
  });

  readonly missingIngredients = computed(() => {
    const list: string[] = [];
    this.dayMeals().forEach((m) => {
      if (m.missingIngredients) {
        list.push(...m.missingIngredients);
      }
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

  addMissingToShoppingList(meal: PlannedMeal): void {
    this.mealPlannerService.addMissingToShoppingList(meal);
  }
}
