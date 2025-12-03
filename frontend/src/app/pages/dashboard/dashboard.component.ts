import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ExpiredItemsContainerComponent } from './dashboard-components/expired-items-container/expired-items-container.component';
import { CategoryContainerComponent } from './dashboard-components/category-container/category-container.component';
import { QuickActionsContainerComponent } from './dashboard-components/quick-actions-container/quick-actions-container.component';
import { Item } from '../../models/items.model';
import { InventoryService } from '../../services/inventory/inventory.service';
import { isExpired } from '../../utility/itemUtility';

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

  expiredItems: Item[] = [];

  constructor(private inventoryService: InventoryService) {
    this.expiredItems = this.inventoryService.getItems().filter(item => isExpired(item));
  }
}
