import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { IngredientCategory } from '@models/ingredient-category.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IngredientCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/ingredient-categories';
  private categoriesCache$?: Observable<IngredientCategory[]>;

  getIngredientCategories(): Observable<IngredientCategory[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http
        .get<ApiResponse<IngredientCategory[]>>(this.apiUrl)
        .pipe(mapResponseData<IngredientCategory[]>(), shareReplay(1));
    }
    return this.categoriesCache$;
  }

  getIngredientCategoryById(id: number): Observable<IngredientCategory> {
    return this.http
      .get<ApiResponse<IngredientCategory>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<IngredientCategory>());
  }

  // Legacy Aliases
  getNutrientGroups(): Observable<IngredientCategory[]> {
    return this.getIngredientCategories();
  }

  getNutrientGroupById(id: number): Observable<IngredientCategory> {
    return this.getIngredientCategoryById(id);
  }

  getNutrientTypes(): Observable<IngredientCategory[]> {
    return this.getIngredientCategories();
  }

  getNutrientTypeById(id: number): Observable<IngredientCategory> {
    return this.getIngredientCategoryById(id);
  }
}

export { IngredientCategoryService as NutrientTypeService };
