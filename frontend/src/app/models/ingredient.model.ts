import { Category } from "@models/category.model";
import { Unit } from "@models/unit.model";

export interface Ingredient {
    id: string;
    name: string;
    category?: Category;
    defaultUnit?: Unit;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IngredientDTO {
    id: string;
    name: string;
    categoryId?: number;
    defaultUnitId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateIngredientDTO {
    name: string;
    categoryId?: number;
    defaultUnitId?: number;
}

export interface UpdateIngredientDTO {
    name?: string;
    categoryId?: number;
    defaultUnitId?: number;
}
