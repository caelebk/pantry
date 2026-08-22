import { UserAudit } from '@models/audit.model';

export interface IngredientGroup {
  id: number;
  name: string;
  ingredientCategoryId?: number;
  ingredientCategoryName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
}
