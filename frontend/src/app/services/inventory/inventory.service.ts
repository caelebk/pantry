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
      bestBeforeDate: new Date('2026-05-14'),
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
    },
    {
      name: 'Chicken Breast',
      category: Category.MeatSeafood,
      quantity: 1.5,
      unit: Unit.Kilogram,
      purchaseDate: new Date('2024-11-20'),
      openedDate: undefined,
      bestBeforeDate: new Date('2025-05-20'),
      location: Location.Freezer,
      notes: 'Freeze upon arrival.'
    },
    {
      name: 'Rice',
      category: Category.BakeryGrains,
      quantity: 2,
      unit: Unit.Kilogram,
      purchaseDate: new Date('2024-10-01'),
      openedDate: new Date('2024-11-01'),
      bestBeforeDate: new Date('2026-10-01'),
      location: Location.Pantry,
      notes: 'Keep dry.'
    },
    {
      name: 'Tomatoes',
      category: Category.Produce,
      quantity: 5,
      unit: Unit.Piece,
      purchaseDate: new Date('2024-11-25'),
      openedDate: undefined,
      bestBeforeDate: new Date('2024-12-05'),
      location: Location.Fridge,
      notes: 'Wash before use.'
    },
    {
      name: 'Cheddar Cheese',
      category: Category.DairyEggs,
      quantity: 250,
      unit: Unit.Gram,
      purchaseDate: new Date('2024-11-18'),
      openedDate: new Date('2024-11-20'),
      bestBeforeDate: new Date('2025-01-18'),
      location: Location.Fridge,
      notes: 'Wrap tightly after opening.'
    },
    {
      name: 'Coffee Beans',
      category: Category.Beverages,
      quantity: 500,
      unit: Unit.Gram,
      purchaseDate: new Date('2024-11-10'),
      openedDate: new Date('2024-11-12'),
      bestBeforeDate: new Date('2025-11-10'),
      location: Location.Pantry,
      notes: 'Store in airtight container.'

    }
  ];

  constructor() { }

  getItems(): Item[] {
    return this.items;
  }

  addItem(item: Item) {
    this.items.push(item);
  }

  removeItem(item: Item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }
}
