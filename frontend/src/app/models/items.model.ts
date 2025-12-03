export interface Item {
    name: string;
    category: string;
    quantity: number;
    unit: Unit;
    purchaseDate: Date;
    openedDate: Date;
    bestBeforeDate: Date;
    location: Location;
}

export enum Unit {
    GRAM = 'g',
    KILOGRAM = 'kg',
    LITRE = 'l',
    MILLILITRE = 'ml',
    POUND = 'lb',
    OUNCE = 'oz',
    CUP = 'cup',
    TABLESPOON = 'tbsp',
    TEASPOON = 'tsp',
    PIECE = 'pc',
}

export enum Location {
    SHELF = 'shelf',
    FREEZER = 'freezer',
    PANTRY = 'pantry',
    FRIDGE = 'fridge'
}

export enum Category {
    
}