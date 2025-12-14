import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'category-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './category-container.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CategoryContainerComponent {
  // Mock data for categories
  categories = [
    {
      name: 'Dairy & Eggs',
      count: 2,
      percentage: 40,
    },
    {
      name: 'Oils & Condiments',
      count: 1,
      percentage: 20,
    },
    {
      name: 'Grains & Baking',
      count: 1,
      percentage: 20,
    },
    {
      name: 'Produce',
      count: 1,
      percentage: 20,
    },
  ];
}
