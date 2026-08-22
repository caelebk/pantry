import { UserAuditDTO } from './audit.model.ts';

// Full response object
export interface IngredientDTO {
  id: string; // UUID
  name: string;
  ingredientGroupId?: number;
  ingredientGroupName?: string;
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
  defaultUnitId: number;
}

// Update DTO - all create fields are optional
export interface UpdateIngredientDTO extends Partial<CreateIngredientDTO> {}
