import { IngredientCategory } from './ingredient-category.model';
import { IngredientGroup as IngredientGroupDefinition } from './ingredient-group.model';
import { Ingredient } from './ingredient.model';
import { Item } from './items.model';

export interface EnrichedIngredient extends Ingredient {
  items: Item[];
  itemCount: number;
}

export interface IngredientGroupCluster {
  group: IngredientGroupDefinition | { id: number; name: string };
  category?: IngredientCategory | { id: number; name: string };
  ingredients: EnrichedIngredient[];
}

export interface IngredientCategoryCluster {
  category: IngredientCategory;
  nutrientType?: IngredientCategory;
  ingredientGroups: IngredientGroupCluster[];
  categoryGroups?: IngredientGroupCluster[];
}

// Legacy Aliases
export type NutrientGroup = IngredientCategoryCluster;
export type NutrientGroupCluster = IngredientCategoryCluster;

export interface SubstitutionSuggestion {
  ingredient: Ingredient;
  availableQuantityBase: number;
  matchLevel: 'same_group' | 'same_ingredient_category' | 'same_nutrient_type' | 'same_category';
  groupName: string;
}
