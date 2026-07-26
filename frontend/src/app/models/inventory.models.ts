import { IngredientGroup } from './ingredient-group.model';
import { Ingredient } from './ingredient.model';
import { Item } from './items.model';
import { NutrientGroup as NutrientGroupModel } from './nutrient-group.model';

export interface EnrichedIngredient extends Ingredient {
  items: Item[];
  itemCount: number;
}

export interface IngredientGroupCluster {
  group: IngredientGroup | { id: number; name: string };
  ingredients: EnrichedIngredient[];
}

export interface NutrientGroupCluster {
  nutrientGroup: NutrientGroupModel;
  ingredientGroups: IngredientGroupCluster[];
}

export interface SubstitutionSuggestion {
  ingredient: Ingredient;
  availableQuantityBase: number;
  matchLevel: 'same_group' | 'same_nutrient_type';
  groupName: string;
}
