import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AddItemFormComponent } from './inventory-components/add-item-form/add-item-form.component';
import { ItemCardComponent } from './inventory-components/item-card/item-card.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { Item } from '../../models/items.model';
import { InventoryService } from '../../services/inventory/inventory.service';
import { isExpired } from '../../utility/itemUtility';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AddItemFormComponent, ItemCardComponent, StatCardComponent],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  totalItemsCount: number = 0;
  expiringSoonItemsCount: number = 0;
  expiredItemsCount: number = 0;
  items: Item[] = [];

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.items = this.inventoryService.getItems();
    this.totalItemsCount = this.items.length;
    this.expiringSoonItemsCount = 0;
    this.expiredItemsCount = this.items.filter(item => isExpired(item)).length;
  }
}
