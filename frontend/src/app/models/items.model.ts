export interface Item {
    id: string;    
    ingredientId: string;
    name: string;
    quantity: number;
    unit: Unit;
    purchaseDate: Date;
    openedDate?: Date;
    expirationDate: Date;
    location: Location;
    notes: string;
}

export interface ItemDTO {
    id: number;
    ingredientId: string;
    label: string;
    quantity: number;
    unitId: number;
    purchaseDate: string;
    openedDate?: string;
    expirationDate: string;
    locationId: number;
    notes?: string;
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
