import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-card.component.html',
  styles: [':host { display: block; }']
})
export class RecipeCardComponent {
  @Input() recipe: any;
}
