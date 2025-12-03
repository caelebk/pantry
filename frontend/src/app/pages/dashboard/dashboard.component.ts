import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ExpiredItemsContainerComponent } from './dashboard-components/expired-items-container/expired-items-container.component';
import { CategoryContainerComponent } from './dashboard-components/category-container/category-container.component';
import { QuickActionsContainerComponent } from './dashboard-components/quick-actions-container/quick-actions-container.component';
import { Item } from '../../models/items.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslocoModule, StatCardComponent, ExpiredItemsContainerComponent, CategoryContainerComponent, QuickActionsContainerComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  totalItemsCount: number = 5;
  expiringSoonItemsCount: number = 0;
  expiredItemsCount: number = 5;
  canMakeRecipesCount: number = 0;

  expiredItems: Item[] = [
    {
      name: 'dashboard.sampleData.oliveOil',
      category: 'categories.oilsCondiments',
      quantity: 2,
      unit: 'bottles',
      purchaseDate: '2024-10-31',
      bestBefore: '2025-10-31'
    },
    {
      name: 'dashboard.sampleData.allPurposeFlour',
      category: 'categories.grainsBaking',
      quantity: 5,
      unit: 'kg',
      purchaseDate: '2024-10-14',
      bestBefore: '2025-10-14'
    },
    {
      name: 'dashboard.sampleData.milk',
      category: 'categories.dairyEggs',
      quantity: 2,
      unit: 'liters',
      purchaseDate: '2024-10-14',
      bestBefore: '2025-10-14'
    }
  ];
}
