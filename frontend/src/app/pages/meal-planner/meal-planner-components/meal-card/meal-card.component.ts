import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'meal-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './meal-card.component.html',
  styles: [
    `:host {
      display: block;
    }`
  ]
})
export class MealCardComponent {
  title = input.required<string>();
  description = input.required<string>();
  missingIngredients = input.required<string[]>();
}
