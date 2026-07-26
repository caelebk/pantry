import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';

export type WeeklyLayoutMode = 'grid' | 'timeline';

@Component({
  selector: 'pantry-weekly-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-view.component.html',
  styleUrl: './weekly-view.component.scss',
})
export class WeeklyViewComponent {
  readonly mealPlannerService = inject(MealPlannerService);

  @Input() meals: PlannedMeal[] = [];
  @Output() addMealRequested = new EventEmitter<{ day: DayOfWeek; mealType: MealType }>();

  readonly days = this.mealPlannerService.days;
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  layoutMode = signal<WeeklyLayoutMode>('grid');

  setLayoutMode(mode: WeeklyLayoutMode): void {
    this.layoutMode.set(mode);
  }

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.meals.filter((m) => m.day === day);
  }

  getMealsForSlot(day: DayOfWeek, mealType: MealType): PlannedMeal[] {
    return this.meals.filter((m) => m.day === day && m.mealType === mealType);
  }

  getDayCalories(day: DayOfWeek): number {
    return this.meals.filter((m) => m.day === day).reduce((sum, m) => sum + (m.calories || 0), 0);
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
