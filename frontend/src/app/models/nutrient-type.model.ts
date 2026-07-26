export interface NutrientGroup {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// Legacy Alias
export type NutrientType = NutrientGroup;
