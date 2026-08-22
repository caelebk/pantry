import { UserAuditDTO } from './audit.model.ts';

export interface IngredientGroupDTO {
  id: number;
  name: string;
  ingredientCategoryId?: number;
  ingredientCategoryName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: UserAuditDTO;
  updatedBy?: UserAuditDTO;
}

export interface CreateIngredientGroupDTO {
  name: string;
  ingredientCategoryId?: number;
}

export interface UpdateIngredientGroupDTO {
  name?: string;
  ingredientCategoryId?: number;
}
