import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'pantry-recipe-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './recipe-card.component.html',
  styles: [':host { display: block; }'],
})
export class RecipeCardComponent {
  @Input() recipe: any;
}
