import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './meal-planner.component.html',
})
export class MealPlannerComponent {}
