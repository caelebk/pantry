import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { CreateRecipeDTO, Recipe } from '@models/recipe.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/v1/recipes';

  private recipesCache$?: Observable<Recipe[]>;
  private availableRecipesCache$?: Observable<Recipe[]>;
  private cacheKitchenId?: string;

  private get activeKitchenId(): string {
    return this.authService.activeKitchen()?.id ?? '';
  }

  getRecipes(): Observable<Recipe[]> {
    const kitchenId = this.activeKitchenId;
    if (!this.recipesCache$ || this.cacheKitchenId !== kitchenId) {
      this.cacheKitchenId = kitchenId;
      this.recipesCache$ = this.http
        .get<ApiResponse<Recipe[]>>(this.apiUrl)
        .pipe(mapResponseData<Recipe[]>(), shareReplay(1));
    }
    return this.recipesCache$;
  }

  getAvailableRecipes(): Observable<Recipe[]> {
    const kitchenId = this.activeKitchenId;
    if (!this.availableRecipesCache$ || this.cacheKitchenId !== kitchenId) {
      this.cacheKitchenId = kitchenId;
      this.availableRecipesCache$ = this.http
        .get<ApiResponse<Recipe[]>>(`${this.apiUrl}/available`)
        .pipe(mapResponseData<Recipe[]>(), shareReplay(1));
    }
    return this.availableRecipesCache$;
  }

  getRecipeById(id: string): Observable<Recipe> {
    return this.http
      .get<ApiResponse<Recipe>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<Recipe>());
  }

  private clearCache(): void {
    this.recipesCache$ = undefined;
    this.availableRecipesCache$ = undefined;
  }

  createRecipe(dto: CreateRecipeDTO): Observable<Recipe> {
    return this.http.post<ApiResponse<Recipe>>(this.apiUrl, dto).pipe(
      mapResponseData<Recipe>(),
      tap(() => this.clearCache()),
    );
  }

  updateRecipe(id: string, dto: CreateRecipeDTO): Observable<Recipe> {
    return this.http.put<ApiResponse<Recipe>>(`${this.apiUrl}/${id}`, dto).pipe(
      mapResponseData<Recipe>(),
      tap(() => this.clearCache()),
    );
  }

  deleteRecipe(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      mapResponseData<boolean>(),
      tap(() => this.clearCache()),
    );
  }
}
