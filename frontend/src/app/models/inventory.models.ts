import { Category } from "./category.model";
import { Ingredient } from "./ingredient.model";
import { Item } from "./items.model";

export interface EnrichedIngredient extends Ingredient {
    items: Item[];
    itemCount: number;
}

export interface IngredientGroup {
    category: Category | { id: number; name: string };
    ingredients: EnrichedIngredient[];
}
