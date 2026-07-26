/**
 * Nutrient Group Data Models
 */

export interface NutrientGroupDTO {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// Legacy Alias
export type NutrientTypeDTO = NutrientGroupDTO;
