export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  source?: 'manual' | 'low_stock' | 'recipe_plan';
  recipeName?: string;
}

export interface AddShoppingItemDTO {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  source?: 'manual' | 'low_stock' | 'recipe_plan';
  recipeName?: string;
}
