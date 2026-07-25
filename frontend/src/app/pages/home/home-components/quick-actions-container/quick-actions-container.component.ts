import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'pantry-quick-actions-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './quick-actions-container.component.html',
  host: { class: 'block' },
})
export class QuickActionsContainerComponent {
  private readonly router = inject(Router);

  onAddItem(): void {
    this.router.navigate(['/inventory/new']);
  }

  onAddRecipe(): void {
    this.router.navigate(['/recipes/new']);
  }

  onAssignIngredients(): void {
    this.router.navigate(['/inventory'], { queryParams: { tab: 'assign' } });
  }

  onBrowseInventory(): void {
    this.router.navigate(['/inventory']);
  }

  onBrowseRecipes(): void {
    this.router.navigate(['/recipes']);
  }
}
