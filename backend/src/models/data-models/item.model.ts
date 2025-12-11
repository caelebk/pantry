/**
 * Item Data Models
 */

// Full response object
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

// Creation DTO - omit system fields
export interface CreateItemDTO {
  // Required
  label: string;
  quantity: number;
  unitId: number;
  locationId: number;
  expirationDate: string | Date; // Allow string from JSON
  purchaseDate: string | Date; // Allow string from JSON

  // Optional
  ingredientId?: string;
  openedDate?: string | Date; // Allow string from JSON
  notes?: string;
}

// Update DTO - all create fields are optional
export interface UpdateItemDTO extends Partial<CreateItemDTO> {}
