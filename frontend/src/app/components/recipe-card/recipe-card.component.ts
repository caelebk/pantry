import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './recipe-card.component.html',
  styles: [':host { display: block; }']
})
export class RecipeCardComponent {
  @Input() recipe: any;
}
