import { Injectable } from '@angular/core';
import { Item, Unit, Location } from '../../models/items.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private items: Item[] = [
    {
      name: 'All-Purpose Flour',
      category: 'Grains & Baking',
      quantity: 5,
      unit: Unit.KILOGRAM,
      purchaseDate: new Date('2024-10-14'),
      openedDate: new Date('2024-10-14'),
      bestBeforeDate: new Date('2025-10-14'),
      location: Location.PANTRY
    },
    {
      name: 'Olive Oil',
      category: 'Oils & Condiments',
      quantity: 400,
      unit: Unit.MILLILITRE,
      purchaseDate: new Date('2024-10-31'),
      openedDate: new Date('2024-10-31'),
      bestBeforeDate: new Date('2025-10-31'),
      location: Location.PANTRY
    },
    {
      name: 'Salt',
      category: 'Spices & Seasonings',
      quantity: 1,
      unit: Unit.PIECE,
      purchaseDate: new Date('2024-11-15'),
      openedDate: new Date('2024-11-15'),
      bestBeforeDate: new Date('2028-11-15'),
      location: Location.PANTRY
    },
    {
      name: 'Milk',
      category: 'Dairy & Eggs',
      quantity: 2,
      unit: Unit.LITRE,
      purchaseDate: new Date('2024-10-14'),
      openedDate: new Date('2024-10-14'),
      bestBeforeDate: new Date('2025-10-14'),
      location: Location.FRIDGE
    }
  ];

  constructor() { }

  // Example method
  getItems(): Item[] {
    return this.items;
  }
}
