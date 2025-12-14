import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { InventoryCardComponent } from './meal-planner-components/inventory-card/inventory-card.component';
import { MealCardComponent } from './meal-planner-components/meal-card/meal-card.component';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, TranslocoModule, InventoryCardComponent, MealCardComponent],
  templateUrl: './meal-planner.component.html',
})
export class MealPlannerComponent {}
