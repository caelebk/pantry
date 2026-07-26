import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { NutrientGroup } from '@models/nutrient-type.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NutrientTypeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/nutrient-groups';

  getNutrientGroups(): Observable<NutrientGroup[]> {
    return this.http
      .get<ApiResponse<NutrientGroup[]>>(this.apiUrl)
      .pipe(mapResponseData<NutrientGroup[]>());
  }

  getNutrientGroupById(id: number): Observable<NutrientGroup> {
    return this.http
      .get<ApiResponse<NutrientGroup>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<NutrientGroup>());
  }

  // Legacy Aliases
  getNutrientTypes(): Observable<NutrientGroup[]> {
    return this.getNutrientGroups();
  }

  getNutrientTypeById(id: number): Observable<NutrientGroup> {
    return this.getNutrientGroupById(id);
  }
}
