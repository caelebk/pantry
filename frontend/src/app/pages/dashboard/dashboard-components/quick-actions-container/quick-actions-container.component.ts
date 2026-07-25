import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'pantry-quick-actions-container',
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
  private readonly router = inject(Router);

  onAddItem() {
    this.router.navigate(['/inventory/new']);
  }

  onAddRecipe() {
    this.router.navigate(['/recipes/new']);
  }
}
