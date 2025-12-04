import { Injectable } from '@angular/core';
import { Item, Unit, Location, Category } from '../../models/items.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private items: Item[] = [
    {
      name: 'All-Purpose Flour',
      category: Category.BakeryGrains,
      quantity: 5,
      unit: Unit.Kilogram,
      purchaseDate: new Date('2024-10-14'),
      openedDate: new Date('2024-10-14'),
      bestBeforeDate: new Date('2025-10-14'),
      location: Location.Pantry,
      notes: 'Store in a cool, dry place.'
    },
    {
      name: 'Olive Oil',
      category: Category.OilsCondiments,
      quantity: 400,
      unit: Unit.Millilitre,
      purchaseDate: new Date('2024-10-31'),
      openedDate: new Date('2024-10-31'),
      bestBeforeDate: new Date('2025-10-31'),
      location: Location.Pantry,
      notes: 'Store in a cool, dark place.'
    },
    {
      name: 'Salt',
      category: Category.SpicesSeasonings,
      quantity: 1,
      unit: Unit.Piece,
      purchaseDate: new Date('2024-11-15'),
      openedDate: new Date('2024-11-15'),
      bestBeforeDate: new Date('2028-11-15'),
      location: Location.Pantry,
      notes: 'Store in a cool, dry place.'
    },
    {
      name: 'Milk',
      category: Category.DairyEggs,
      quantity: 2,
      unit: Unit.Litre,
      purchaseDate: new Date('2024-10-14'),
      openedDate: new Date('2024-10-14'),
      bestBeforeDate: new Date('2025-10-14'),
      location: Location.Fridge,
      notes: 'Store in the refrigerator.'
    }
  ];

  constructor() { }

  // Example method
  getItems(): Item[] {
    return this.items;
  }
}
