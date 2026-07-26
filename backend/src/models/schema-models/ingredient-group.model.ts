/**
 * Ingredient Group Database Schema
 */
export interface IngredientGroupRow {
  id: number;
  name: string;
  ingredient_category_id: number | null;
  nutrient_group_id?: number | null;
}
