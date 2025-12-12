export interface Item {
    name: string;
    quantity: number;
    unit: Unit;
    purchaseDate: Date;
    openedDate?: Date;
    bestBeforeDate: Date;
    location: Location;
    notes: string;
}

export enum Unit {
    Gram = "g",
    Kilogram = "kg",
    Litre = "l",
    Millilitre = "ml",
    Pound = "lb",
    Ounce = "oz",
    Cup = "cup",
    Tablespoon = "tbsp",
    Teaspoon = "tsp",
    Piece = "pc",
}

export enum Location {
    Shelf = "Shelf",
    Freezer = "Freezer",
    Fridge = "Fridge",
    Pantry = "Pantry",
}
