import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  difficulty: string;
  prepTime: number;
  cookTime: number;
  tags: string[];
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  instructions: string[];
}
@Component({
  selector: 'pantry-recipe-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './recipe-card.component.html',
  styles: [':host { display: block; }'],
})
export class RecipeCardComponent {
  @Input() recipe: Recipe = {} as Recipe;
}
