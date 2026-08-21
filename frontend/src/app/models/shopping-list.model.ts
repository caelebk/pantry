import { UserAudit } from '@models/audit.model';

export interface ShoppingItem {
  id: string;
  ingredientId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  estimatedPrice?: number;
  storeName?: string;
  storeId?: string;
  source?: 'manual' | 'low_stock' | 'recipe_plan';
  recipeName?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
}

export interface AddShoppingItemDTO {
  ingredientId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  storeName?: string;
  storeId?: string;
  duplicateMode?: 'reject' | 'merge';
  source?: 'manual' | 'low_stock' | 'recipe_plan';
  recipeName?: string;
}
