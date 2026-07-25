/**
 * Nutrient Type Database Schema
 */
export interface NutrientTypeRow {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}
