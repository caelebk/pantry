import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { StatCardComponent } from '@components/stat-card/stat-card.component';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme } from '@models/items.model';
import { ItemService } from '@services/inventory/item.service';
import { isExpired, isExpiringSoon } from '@utility/itemUtility/ItemUtility';
import { ItemsContainerComponent } from './dashboard-components/items-container/items-container.component';
import { QuickActionsContainerComponent } from './dashboard-components/quick-actions-container/quick-actions-container.component';

@Component({
  selector: 'pantry-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    StatCardComponent,
    ItemsContainerComponent,
    QuickActionsContainerComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly Theme = ItemsContainerTheme;
  private readonly itemService = inject(ItemService);

  items = signal<Item[]>([]);
  expiredItems = signal<Item[]>([]);
  soonToExpireItems = signal<Item[]>([]);
  availableItems = signal<Item[]>([]);

  totalItemsCount = computed(() => this.items().length);
  expiredItemsCount = computed(() => this.expiredItems().length);
  expiringSoonItemsCount = computed(() => this.soonToExpireItems().length);
  canMakeRecipesCount = 0;

  constructor() {
    this.fetchItems();
  }

  fetchItems() {
    this.itemService.getItems().subscribe((items: Item[]) => {
      this.items.set(items);
      this.expiredItems.set(this.items().filter((item) => isExpired(item)));
      this.soonToExpireItems.set(this.items().filter((item) => isExpiringSoon(item)));
      this.availableItems.set(
        this.items().filter((item) => !isExpired(item) && !isExpiringSoon(item)),
      );
    });
  }
}
