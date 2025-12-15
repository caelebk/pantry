import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'pantry-inventory-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory-card.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class InventoryCardComponent {
  label = input.required<string>();
  value = input.required<string>();
}
