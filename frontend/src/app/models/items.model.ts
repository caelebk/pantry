import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';

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

export interface UpdateItemDTO {
  label?: string;
  ingredientId?: string;
  quantity?: number;
  unitId?: number;
  purchaseDate?: string;
  openedDate?: string;
  expirationDate?: string;
  locationId?: number;
  notes?: string;
}

export interface ItemTimeStatus {
  label: string;
  isExpired: boolean;
  isClose: boolean;
}

export enum ItemsContainerTheme {
  Red = 'red',
  Orange = 'orange',
  Gray = 'gray',
  Blue = 'blue',
}
