import { Category } from "./category.model";
import { Ingredient } from "./ingredient.model";
import { Item } from "./items.model";
import { NutrientType } from "./nutrient-type.model";

export interface EnrichedIngredient extends Ingredient {
    items: Item[];
    itemCount: number;
}

export interface IngredientGroup {
    category: Category | { id: number; name: string };
    ingredients: EnrichedIngredient[];
}

export interface NutrientGroup {
    nutrientType: NutrientType;
    categoryGroups: IngredientGroup[];
}

export interface SubstitutionSuggestion {
    ingredient: Ingredient;
    availableQuantityBase: number;
    matchLevel: 'same_category' | 'same_nutrient_type';
    categoryName: string;
}
