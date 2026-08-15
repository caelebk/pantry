export interface ShoppingListItemDTO {
  id: string;
  ingredientId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  estimatedPrice: number;
  storeName: string;
  storeId?: string;
  source: 'low_stock' | 'recipe_plan' | 'manual';
  recipeName?: string;
  createdAt?: string;
}

export interface CreateShoppingListItemDTO {
  ingredientId?: string;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  checked?: boolean;
  estimatedPrice?: number;
  storeName?: string;
  storeId?: string;
  duplicateMode?: 'reject' | 'merge';
  source?: 'low_stock' | 'recipe_plan' | 'manual';
  recipeName?: string;
}

export interface UpdateShoppingListItemDTO {
  ingredientId?: string;
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  checked?: boolean;
  estimatedPrice?: number;
  storeName?: string;
  storeId?: string;
  source?: 'low_stock' | 'recipe_plan' | 'manual';
  recipeName?: string;
}
