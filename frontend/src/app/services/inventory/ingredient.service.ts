import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { IngredientGroup } from "@models/category.model";
import { ApiResponse } from "@models/http.model";
import { SubstitutionSuggestion } from "@models/inventory.models";
import {
  CreateIngredientDTO,
  Ingredient,
  IngredientDTO,
  UpdateIngredientDTO,
} from "@models/ingredient.model";
import { Unit } from "@models/unit.model";
import { mapResponseData } from "@utility/httpUtility/HttpResponse.operator";
import { forkJoin, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { CategoryService } from "./category.service";
import { UnitService } from "./unit.service";

@Injectable({
  providedIn: "root",
})
export class IngredientService {
  private readonly http = inject(HttpClient);
  private readonly categoryService = inject(CategoryService);
  private readonly unitService = inject(UnitService);
  private readonly apiUrl = "http://localhost:8000/api/ingredients";

  getIngredients(): Observable<Ingredient[]> {
    return forkJoin({
      ingredients: this.http
        .get<ApiResponse<IngredientDTO[]>>(this.apiUrl)
        .pipe(mapResponseData<IngredientDTO[]>()),
      categories: this.categoryService.getCategories(),
      units: this.unitService.getUnits(),
    }).pipe(
      map(({ ingredients, categories, units }) => {
        const categoryMap = new Map(
          categories.map((c: IngredientGroup) => [c.id, c]),
        );
        const unitMap = new Map(units.map((u: Unit) => [u.id, u]));

        return ingredients.map((dto: IngredientDTO) => {
          const groupId = dto.ingredientGroupId ?? dto.categoryId;
          const groupObj = groupId ? categoryMap.get(groupId) : undefined;
          return {
            id: dto.id,
            name: dto.name,
            ingredientGroup: groupObj,
            category: groupObj,
            defaultUnit: dto.defaultUnitId
              ? unitMap.get(dto.defaultUnitId)
              : undefined,
            createdAt: dto.createdAt
              ? new Date(dto.createdAt)
              : undefined,
            updatedAt: dto.updatedAt
              ? new Date(dto.updatedAt)
              : undefined,
          };
        });
      }),
    );
  }

  getIngredientById(id: string): Observable<Ingredient> {
    return forkJoin({
      ingredient: this.http
        .get<ApiResponse<IngredientDTO>>(`${this.apiUrl}/${id}`)
        .pipe(mapResponseData<IngredientDTO>()),
      categories: this.categoryService.getCategories(),
      units: this.unitService.getUnits(),
    }).pipe(
      map(({ ingredient, categories, units }) => {
        const categoryMap = new Map(
          categories.map((c: IngredientGroup) => [c.id, c]),
        );
        const unitMap = new Map(units.map((u: Unit) => [u.id, u]));
        const groupId = ingredient.ingredientGroupId ?? ingredient.categoryId;
        const groupObj = groupId ? categoryMap.get(groupId) : undefined;

        return {
          id: ingredient.id,
          name: ingredient.name,
          ingredientGroup: groupObj,
          category: groupObj,
          defaultUnit: ingredient.defaultUnitId
            ? unitMap.get(ingredient.defaultUnitId)
            : undefined,
          createdAt: ingredient.createdAt
            ? new Date(ingredient.createdAt)
            : undefined,
          updatedAt: ingredient.updatedAt
            ? new Date(ingredient.updatedAt)
            : undefined,
        };
      }),
    );
  }

  createIngredient(dto: CreateIngredientDTO): Observable<IngredientDTO> {
    return this.http
      .post<ApiResponse<IngredientDTO>>(this.apiUrl, dto)
      .pipe(mapResponseData<IngredientDTO>());
  }

  updateIngredient(
    id: string,
    dto: UpdateIngredientDTO,
  ): Observable<IngredientDTO> {
    return this.http
      .put<ApiResponse<IngredientDTO>>(`${this.apiUrl}/${id}`, dto)
      .pipe(mapResponseData<IngredientDTO>());
  }

  deleteIngredient(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<boolean>());
  }

  getSubstitutions(id: string): Observable<SubstitutionSuggestion[]> {
    return this.http
      .get<ApiResponse<SubstitutionSuggestion[]>>(`${this.apiUrl}/${id}/substitutions`)
      .pipe(mapResponseData<SubstitutionSuggestion[]>());
  }
}
