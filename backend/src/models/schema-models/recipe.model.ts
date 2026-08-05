export interface DifficultyRow {
  id: number;
  name: string;
}

export interface RecipeRow {
  id: string; // UUID
  name: string;
  description: string | null;
  difficulty_id: number | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredientRow {
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit_id: number | null;
  ingredient_order?: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeStepRow {
  id: string; // UUID
  recipe_id: string;
  step_number: number;
  instruction_text: string;
  image_url: string | null;
  timer_seconds: number | null;
  textarea_height?: number | null;
}
