/**
 * Item model - Pantry inventory item
 */

export interface Item {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate?: Date;
  purchaseDate?: Date;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemDTO {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  purchaseDate?: string;
  location?: string;
  notes?: string;
}

export interface UpdateItemDTO {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  expirationDate?: string;
  purchaseDate?: string;
  location?: string;
  notes?: string;
}
