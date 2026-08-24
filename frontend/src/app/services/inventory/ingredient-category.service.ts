import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { IngredientCategory } from '@models/ingredient-category.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class IngredientCategoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/v1/ingredient-categories';
  private categoriesCache$?: Observable<IngredientCategory[]>;
  private cacheKitchenId?: string;

  private get activeKitchenId(): string {
    return this.authService.activeKitchen()?.id ?? '';
  }

  getIngredientCategories(): Observable<IngredientCategory[]> {
    const kitchenId = this.activeKitchenId;
    if (!this.categoriesCache$ || this.cacheKitchenId !== kitchenId) {
      this.cacheKitchenId = kitchenId;
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
}
