import { UserAudit } from '@models/audit.model';

export interface IngredientGroup {
  id: number;
  name: string;
  ingredientCategoryId?: number;
  ingredientCategoryName?: string;
  expiredCount?: number;
  expiringCount?: number;
  inStockCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
}
