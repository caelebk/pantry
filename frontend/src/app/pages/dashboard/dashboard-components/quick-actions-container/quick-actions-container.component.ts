import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'quick-actions-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './quick-actions-container.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class QuickActionsContainerComponent {
  // Action handlers can be added here
  onAddItem() {
    console.log('Add item clicked');
  }

  onAddRecipe() {
    console.log('Add recipe clicked');
  }

  onPlanMeals() {
    console.log('Plan meals clicked');
  }
}
