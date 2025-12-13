import { Location } from "./location.model";
import { Unit } from "./unit.model";


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
    id: string;
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