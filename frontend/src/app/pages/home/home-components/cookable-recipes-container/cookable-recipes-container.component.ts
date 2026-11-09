import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';
import { CardComponent, EmptyStateComponent } from '@ui';
import { recipeTotalTime } from '@utility/recipe-metadata';

@Component({
  selector: 'pantry-cookable-recipes-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule, CardComponent, EmptyStateComponent, RouterLink],
  templateUrl: './cookable-recipes-container.component.html',
  styleUrls: ['./cookable-recipes-container.component.scss'],
  host: { class: 'block' },
})
export class CookableRecipesContainerComponent {
  readonly totalTime = recipeTotalTime;

  recipes = input<Recipe[]>([]);
}
