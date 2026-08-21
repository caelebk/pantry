import { UserAuditDTO } from './audit.model.ts';

// Full response object
export interface IngredientDTO {
  id: string; // UUID
  name: string;
  ingredientGroupId?: number;
  ingredientGroupName?: string;
  categoryId?: number; // Legacy alias fallback
  defaultUnitId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: UserAuditDTO;
  updatedBy?: UserAuditDTO;
}

// Creation DTO - omit system fields
export interface CreateIngredientDTO {
  name: string;
  ingredientGroupId?: number;
  categoryId?: number; // Legacy alias fallback
  defaultUnitId: number;
}

// Update DTO - all create fields are optional
export interface UpdateIngredientDTO extends Partial<CreateIngredientDTO> {}
