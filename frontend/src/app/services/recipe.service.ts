import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { CreateRecipeDTO, Recipe } from '@models/recipe.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/recipes';

  getRecipes(): Observable<Recipe[]> {
    return this.http
      .get<ApiResponse<Recipe[]>>(this.apiUrl)
      .pipe(mapResponseData<Recipe[]>());
  }

  getAvailableRecipes(): Observable<Recipe[]> {
    return this.http
      .get<ApiResponse<Recipe[]>>(`${this.apiUrl}/available`)
      .pipe(mapResponseData<Recipe[]>());
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http
      .get<ApiResponse<Recipe>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<Recipe>());
  }

  createRecipe(dto: CreateRecipeDTO): Observable<Recipe> {
    return this.http
      .post<ApiResponse<Recipe>>(this.apiUrl, dto)
      .pipe(mapResponseData<Recipe>());
  }

  updateRecipe(id: string, dto: CreateRecipeDTO): Observable<Recipe> {
    return this.http
      .put<ApiResponse<Recipe>>(`${this.apiUrl}/${id}`, dto)
      .pipe(mapResponseData<Recipe>());
  }

  deleteRecipe(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<boolean>());
  }
}
