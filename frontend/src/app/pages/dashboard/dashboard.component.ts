import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ExpiredItemsContainerComponent } from './dashboard-components/expired-items-container/expired-items-container.component';
import { CategoryContainerComponent } from './dashboard-components/category-container/category-container.component';
import { QuickActionsContainerComponent } from './dashboard-components/quick-actions-container/quick-actions-container.component';
import { Item } from '../../models/items.model';
import { ItemService } from '../../services/inventory/item.service';
import { isExpired } from '../../utility/itemUtility';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslocoModule, StatCardComponent, ExpiredItemsContainerComponent, CategoryContainerComponent, QuickActionsContainerComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  totalItemsCount: number;
  expiredItemsCount: number;
  expiringSoonItemsCount: number = 0;
  canMakeRecipesCount: number = 0;

  items: Item[] = [];
  expiredItems: Item[] = [];

  constructor(private inventoryService: ItemService) {
    this.items = [];
    this.expiredItems = [];
    this.totalItemsCount = this.items.length;
    this.expiredItemsCount = this.expiredItems.length;
  }
}
