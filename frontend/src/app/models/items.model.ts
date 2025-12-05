export interface Item {
    name: string;
    category: Category;
    quantity: number;
    unit: Unit;
    purchaseDate: Date;
    openedDate?: Date;
    bestBeforeDate: Date;
    location: Location;
    notes: string;
}

export enum Unit {
    Gram = 'g',
    Kilogram = 'kg',
    Litre = 'l',
    Millilitre = 'ml',
    Pound = 'lb',
    Ounce = 'oz',
    Cup = 'cup',
    Tablespoon = 'tbsp',
    Teaspoon = 'tsp',
    Piece = 'pc',
}

export enum Location {
    Shelf = 'Shelf',
    Freezer = 'Freezer',
    Fridge = 'Fridge',
    Pantry = 'Pantry',
}

export enum Category {
  Produce = "Produce",
  MeatSeafood = "Meat & Seafood",
  DairyEggs = "Dairy & Eggs",
  BakeryGrains = "Bakery & Grains",
  PantryStaples = "Pantry Staples",
  CannedGoods = "Canned Goods",
  OilsCondiments = "Oils & Condiments",
  SpicesSeasonings = "Spices & Seasonings",
  Snacks = "Snacks",
  FrozenFoods = "Frozen Foods",
  Beverages = "Beverages",
  Breakfast = "Breakfast",
  ReadyToEat = "Ready-to-Eat",
  Baking = "Baking",
}
