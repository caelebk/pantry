import { UserAudit } from '@models/audit.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Unit } from '@models/unit.model';

export interface Ingredient {
  id: string;
  name: string;
  ingredientGroup?: IngredientGroup;
  category?: IngredientGroup;
  defaultUnit?: Unit;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
}

export interface IngredientDTO {
  id: string;
  name: string;
  ingredientGroupId?: number;
  defaultUnitId?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
}

export interface CreateIngredientDTO {
  name: string;
  ingredientGroupId?: number;
  defaultUnitId: number;
}

export interface UpdateIngredientDTO {
  name?: string;
  ingredientGroupId?: number;
  defaultUnitId?: number;
}
