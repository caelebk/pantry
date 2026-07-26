import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';

export interface IngredientItem {
  id: string;
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: Unit;
  purchaseDate: Date;
  openedDate?: Date;
  expirationDate: Date;
  location: Location;
  notes: string;
}

export interface IngredientItemDTO {
  id: string;
  ingredientId?: string;
  label: string;
  quantity: number;
  unitId: number;
  purchaseDate: string;
  openedDate?: string;
  expirationDate: string;
  locationId: number;
  notes?: string;
}

export interface UpdateIngredientItemDTO {
  label?: string;
  ingredientId?: string | null;
  quantity?: number;
  unitId?: number;
  purchaseDate?: string;
  openedDate?: string;
  expirationDate?: string;
  locationId?: number;
  notes?: string;
}

// Legacy Aliases
export type Item = IngredientItem;
export type ItemDTO = IngredientItemDTO;
export type UpdateItemDTO = UpdateIngredientItemDTO;

export interface ItemTimeStatus {
  label: string;
  isExpired: boolean;
  isClose: boolean;
}

export enum ItemsContainerTheme {
  Red = 'red',
  Orange = 'orange',
  Gray = 'gray',
  Amber = 'amber',
}
