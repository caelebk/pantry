import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { Store } from '@models/store.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/stores';

  getStores(): Observable<Store[]> {
    return this.http.get<ApiResponse<Store[]>>(this.apiUrl).pipe(mapResponseData<Store[]>());
  }

  createStore(name: string): Observable<Store> {
    return this.http.post<ApiResponse<Store>>(this.apiUrl, { name }).pipe(mapResponseData<Store>());
  }

  updateStore(id: string, patch: Partial<Pick<Store, 'name' | 'archived'>>): Observable<Store> {
    return this.http
      .put<ApiResponse<Store>>(`${this.apiUrl}/${id}`, patch)
      .pipe(mapResponseData<Store>());
  }
}
