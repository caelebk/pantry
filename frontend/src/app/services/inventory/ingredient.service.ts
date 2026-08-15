import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import {
  CreateIngredientDTO,
  Ingredient,
  IngredientDTO,
  UpdateIngredientDTO,
} from '@models/ingredient.model';
import { SubstitutionSuggestion } from '@models/inventory.models';
import { Unit } from '@models/unit.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { forkJoin, Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { IngredientGroupService } from './ingredient-group.service';
import { UnitService } from './unit.service';

import { IngredientItemDTO } from '@models/items.model';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private readonly http = inject(HttpClient);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly apiUrl = '/api/ingredients';
  private ingredientsCache$?: Observable<Ingredient[]>;

  getIngredients(): Observable<Ingredient[]> {
    if (!this.ingredientsCache$) {
      this.ingredientsCache$ = forkJoin({
        ingredients: this.http
          .get<ApiResponse<IngredientDTO[]>>(this.apiUrl)
          .pipe(mapResponseData<IngredientDTO[]>()),
        groups: this.ingredientGroupService.getIngredientGroups(),
        units: this.unitService.getUnits(),
      }).pipe(
        map(({ ingredients, groups, units }) => {
          const groupMap = new Map(groups.map((g: IngredientGroup) => [g.id, g]));
          const unitMap = new Map(units.map((u: Unit) => [u.id, u]));

          return ingredients.map((dto: IngredientDTO) => {
            const groupId = dto.ingredientGroupId;
            const groupObj = groupId ? groupMap.get(groupId) : undefined;
            return {
              id: dto.id,
              name: dto.name,
              ingredientGroup: groupObj,
              category: groupObj,
              defaultUnit: dto.defaultUnitId ? unitMap.get(dto.defaultUnitId) : undefined,
              createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
              updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
            };
          });
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.ingredientsCache$;
  }

  getIngredientById(id: string): Observable<Ingredient> {
    return forkJoin({
      ingredient: this.http
        .get<ApiResponse<IngredientDTO>>(`${this.apiUrl}/${id}`)
        .pipe(mapResponseData<IngredientDTO>()),
      groups: this.ingredientGroupService.getIngredientGroups(),
      units: this.unitService.getUnits(),
    }).pipe(
      map(({ ingredient, groups, units }) => {
        const groupMap = new Map(groups.map((g: IngredientGroup) => [g.id, g]));
        const unitMap = new Map(units.map((u: Unit) => [u.id, u]));
        const groupId = ingredient.ingredientGroupId;
        const groupObj = groupId ? groupMap.get(groupId) : undefined;

        return {
          id: ingredient.id,
          name: ingredient.name,
          ingredientGroup: groupObj,
          category: groupObj,
          defaultUnit: ingredient.defaultUnitId ? unitMap.get(ingredient.defaultUnitId) : undefined,
          createdAt: ingredient.createdAt ? new Date(ingredient.createdAt) : undefined,
          updatedAt: ingredient.updatedAt ? new Date(ingredient.updatedAt) : undefined,
        };
      }),
    );
  }

  createIngredient(dto: CreateIngredientDTO): Observable<IngredientDTO> {
    return this.http.post<ApiResponse<IngredientDTO>>(this.apiUrl, dto).pipe(
      mapResponseData<IngredientDTO>(),
      tap(() => this.clearIngredientsCache()),
    );
  }

  updateIngredient(id: string, dto: UpdateIngredientDTO): Observable<IngredientDTO> {
    return this.http.put<ApiResponse<IngredientDTO>>(`${this.apiUrl}/${id}`, dto).pipe(
      mapResponseData<IngredientDTO>(),
      tap(() => this.clearIngredientsCache()),
    );
  }

  deleteIngredient(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      mapResponseData<boolean>(),
      tap(() => this.clearIngredientsCache()),
    );
  }

  getSubstitutions(id: string): Observable<SubstitutionSuggestion[]> {
    return this.http
      .get<ApiResponse<SubstitutionSuggestion[]>>(`${this.apiUrl}/${id}/substitutions`)
      .pipe(mapResponseData<SubstitutionSuggestion[]>());
  }

  getItemsByIngredientId(id: string): Observable<IngredientItemDTO[]> {
    return this.http
      .get<ApiResponse<IngredientItemDTO[]>>(`${this.apiUrl}/${id}/items`)
      .pipe(mapResponseData<IngredientItemDTO[]>());
  }

  reconcileIngredientUnit(
    id: string,
    newDefaultUnitId: number,
    items: { id: string; quantity: number }[],
  ): Observable<IngredientDTO> {
    return this.http
      .post<ApiResponse<IngredientDTO>>(`${this.apiUrl}/${id}/reconcile-units`, {
        newDefaultUnitId,
        items,
      })
      .pipe(
        mapResponseData<IngredientDTO>(),
        tap(() => this.clearIngredientsCache()),
      );
  }

  private clearIngredientsCache(): void {
    this.ingredientsCache$ = undefined;
  }
}
