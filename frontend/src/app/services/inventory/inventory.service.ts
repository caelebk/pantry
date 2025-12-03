import { Injectable } from '@angular/core';
import { Item } from '../../models/items.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private items: Item[] = [
    {
      name: 'All-Purpose Flour',
      category: 'Grains & Baking',
      quantity: 5,
      unit: 'kg',
      purchaseDate: '2024-10-14',
      bestBefore: '2025-10-14'
    },
    {
      name: 'Olive Oil',
      category: 'Oils & Condiments',
      quantity: 2,
      unit: 'bottles',
      purchaseDate: '2024-10-31',
      bestBefore: '2025-10-31'
    },
    {
      name: 'Salt',
      category: 'Spices & Seasonings',
      quantity: 1,
      unit: 'box',
      purchaseDate: '2024-11-15',
      bestBefore: '2028-11-15'
    }
  ];

  constructor() { }

  // Example method
  getItems(): Item[] {
    return this.items;
  }
}
