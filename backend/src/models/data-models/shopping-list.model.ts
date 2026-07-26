export interface ShoppingListItemDTO {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  estimatedPrice: number;
  storeName: string;
  source: 'low_stock' | 'recipe_plan' | 'manual';
  recipeName?: string;
  createdAt?: string;
}

export interface CreateShoppingListItemDTO {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  checked?: boolean;
  estimatedPrice?: number;
  storeName?: string;
  source?: 'low_stock' | 'recipe_plan' | 'manual';
  recipeName?: string;
}

export interface UpdateShoppingListItemDTO {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  checked?: boolean;
  estimatedPrice?: number;
  storeName?: string;
  source?: 'low_stock' | 'recipe_plan' | 'manual';
  recipeName?: string;
}
