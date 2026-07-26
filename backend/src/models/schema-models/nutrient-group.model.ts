/**
 * Nutrient Group Database Schema
 */
export interface NutrientGroupRow {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

// Legacy Alias
export type NutrientTypeRow = NutrientGroupRow;
