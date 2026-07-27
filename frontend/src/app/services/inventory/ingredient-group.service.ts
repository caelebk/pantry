import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';

export interface CreateIngredientGroupDTO {
  name: string;
  ingredientCategoryId?: number;
  nutrientGroupId?: number;
}

export interface UpdateIngredientGroupDTO {
  name?: string;
  ingredientCategoryId?: number;
  nutrientGroupId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class IngredientGroupService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/ingredient-groups';

  getIngredientGroups(): Observable<IngredientGroup[]> {
    return this.http
      .get<ApiResponse<IngredientGroup[]>>(this.apiUrl)
      .pipe(mapResponseData<IngredientGroup[]>());
  }

  getIngredientGroupById(id: number): Observable<IngredientGroup> {
    return this.http
      .get<ApiResponse<IngredientGroup>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<IngredientGroup>());
  }

  createIngredientGroup(dto: CreateIngredientGroupDTO): Observable<IngredientGroup> {
    return this.http
      .post<ApiResponse<IngredientGroup>>(this.apiUrl, dto)
      .pipe(mapResponseData<IngredientGroup>());
  }

  updateIngredientGroup(id: number, dto: UpdateIngredientGroupDTO): Observable<IngredientGroup> {
    return this.http
      .put<ApiResponse<IngredientGroup>>(`${this.apiUrl}/${id}`, dto)
      .pipe(mapResponseData<IngredientGroup>());
  }

  deleteIngredientGroup(id: number): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<boolean>());
  }
}

// Legacy Alias
export { IngredientGroupService as CategoryService };
