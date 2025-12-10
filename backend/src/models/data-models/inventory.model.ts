// Key Reference Tables
export interface Location {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Unit {
  id: number;
  name: string;
  type?: string; // 'volume' | 'weight' | 'count'
  toBaseFactor?: number;
}

// Ingredient (Base definition of food)
export interface Ingredient {
  id: string; // UUID
  name: string;
  categoryId: number;
  defaultUnitId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Item (Specific instance in pantry)
export interface ItemDTO {
  id: string; // UUID
  ingredientId?: string;
  label: string; 
  quantity: number;
  unitId: number;
  locationId: number;
  expirationDate: Date;
  openedDate?: Date;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateItemDTO {
  ingredientId?: string; // User selects an ingredient
  label: string;
  quantity: number;
  unitId: number;
  locationId: number;
  expirationDate: string;
  openedDate?: string;
  purchaseDate: string;
  notes?: string;
}

export interface UpdateItemDTO {
  label?: string;
  quantity?: number;
  unitId?: number;
  locationId?: number;
  expirationDate?: string;
  openedDate?: string;
  purchaseDate?: string;
  notes?: string;
}
