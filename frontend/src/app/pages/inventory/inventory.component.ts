import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AddItemFormComponent } from '../../components/add-item-form/add-item-form.component';
import { ItemCardComponent } from '../../components/item-card/item-card.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AddItemFormComponent, ItemCardComponent, StatCardComponent],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  totalItems: number = 2;
  expiringSoonItems: number = 0;
  expiredItems: number = 2;
  // Mock data for now
  items = [
    {
      name: 'All-Purpose Flour',
      category: 'Grains & Baking',
      quantity: '5 kg',
      purchaseDate: '2024-10-14',
      bestBefore: '2025-10-14'
    },
    {
      name: 'Olive Oil',
      category: 'Oils & Condiments',
      quantity: '2 bottles',
      purchaseDate: '2024-10-31',
      bestBefore: '2025-10-31'
    }
  ];
}
