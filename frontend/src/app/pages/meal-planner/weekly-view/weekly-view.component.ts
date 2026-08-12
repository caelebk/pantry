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
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';

export type WeeklyLayoutMode = 'grid' | 'timeline';

@Component({
  selector: 'pantry-weekly-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-view.component.html',
  styleUrl: './weekly-view.component.scss',
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

  @Output() addMealRequested = new EventEmitter<{ day: DayOfWeek; mealType: MealType }>();

  readonly days = this.mealPlannerService.days;
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  layoutMode = signal<WeeklyLayoutMode>('grid');

  readonly mealsByDayMap = computed(() => {
    const map = new Map<DayOfWeek, PlannedMeal[]>();
    for (const m of this.mealsInput()) {
      const list = map.get(m.day) || [];
      list.push(m);
      map.set(m.day, list);
    }
    return map;
  });

  readonly caloriesByDayMap = computed(() => {
    const map = new Map<DayOfWeek, number>();
    this.mealsByDayMap().forEach((meals, day) => {
      map.set(
        day,
        meals.reduce((sum, m) => sum + (m.calories || 0), 0),
      );
    });
    return map;
  });

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

  setLayoutMode(mode: WeeklyLayoutMode): void {
    this.layoutMode.set(mode);
  }

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.mealsByDayMap().get(day) || [];
  }

  getMealsForSlot(day: DayOfWeek, mealType: MealType): PlannedMeal[] {
    return this.mealsBySlotMap().get(`${day}_${mealType}`) || [];
  }

  getDayCalories(day: DayOfWeek): number {
    return this.caloriesByDayMap().get(day) || 0;
  }

  onRequestAdd(day: DayOfWeek, type: MealType = 'Dinner'): void {
    this.addMealRequested.emit({ day, mealType: type });
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
