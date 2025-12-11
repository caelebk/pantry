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
  created_at: Date;
  updated_at: Date;
}

export interface RecipeIngredientRow {
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface RecipeStepRow {
  id: string; // UUID
  recipe_id: string;
  step_number: number;
  instruction_text: string;
  image_url: string | null;
  timer_seconds: number | null;
}
