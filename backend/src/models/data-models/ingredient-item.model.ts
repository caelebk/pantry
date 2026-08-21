import { UserAuditDTO } from './audit.model.ts';

// Full response object
export interface IngredientItemDTO {
  id: string; // UUID
  ingredientId?: string;
  label: string;
  quantity: number;
  unitId: number;
  locationId: number;
  expirationDate?: Date;
  openedDate?: Date;
  purchaseDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: UserAuditDTO;
  updatedBy?: UserAuditDTO;
}

// Creation DTO - omit system fields
export interface CreateIngredientItemDTO {
  // Required
  label: string;
  quantity: number;
  unitId: number;
  locationId: number;
  purchaseDate: string | Date; // Allow string from JSON

  // Optional
  expirationDate?: string | Date | null;
  ingredientId?: string | null;
  openedDate?: string | Date; // Allow string from JSON
  notes?: string;
}

// Update DTO - all create fields are optional
export interface UpdateIngredientItemDTO extends Partial<CreateIngredientItemDTO> {}

// Similarity Candidate DTO
export interface ItemSimilarityCandidateDTO {
  item: IngredientItemDTO;
  score: number;
  tier: 'exact' | 'similar';
}

// Legacy Aliases
export type ItemDTO = IngredientItemDTO;
export type CreateItemDTO = CreateIngredientItemDTO;
export type UpdateItemDTO = UpdateIngredientItemDTO;
