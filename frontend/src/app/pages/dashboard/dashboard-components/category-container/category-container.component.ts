import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'category-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './category-container.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CategoryContainerComponent {
  // Mock data for categories
  categories = [
    {
      name: 'categories.dairyEggs',
      count: 2,
      percentage: 40
    },
    {
      name: 'categories.oilsCondiments',
      count: 1,
      percentage: 20
    },
    {
      name: 'categories.grainsBaking',
      count: 1,
      percentage: 20
    },
    {
      name: 'categories.produce',
      count: 1,
      percentage: 20
    }
  ];
}
