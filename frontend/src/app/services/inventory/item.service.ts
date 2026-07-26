import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { IngredientItem, IngredientItemDTO, UpdateIngredientItemDTO } from '@models/items.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import {
  mapItemDTOToItem,
  mapItemToItemDTO,
  mapItemToUpdateItemDTO,
} from '@utility/itemUtility/ItemMapper';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocationService } from './location.service';
import { UnitService } from './unit.service';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly apiUrl = 'http://localhost:8000/api/ingredient-items';

  getIngredientItems(): Observable<IngredientItem[]> {
    return forkJoin({
      items: this.http.get<ApiResponse<IngredientItemDTO[]>>(this.apiUrl).pipe(mapResponseData<IngredientItemDTO[]>()),
      units: this.unitService.getUnits(),
      locations: this.locationService.getLocations(),
    }).pipe(
      map(({ items, units, locations }) => {
        const unitMap = new Map(units.map((u) => [u.id, u]));
        const locationMap = new Map(locations.map((l) => [l.id, l]));

        return items.map((item: IngredientItemDTO) => mapItemDTOToItem(item, unitMap, locationMap));
      }),
    );
  }

  addIngredientItem(item: IngredientItem): Observable<IngredientItemDTO> {
    const itemDTO = mapItemToItemDTO(item);
    return this.http
      .post<ApiResponse<IngredientItemDTO>>(this.apiUrl, itemDTO)
      .pipe(mapResponseData<IngredientItemDTO>());
  }

  removeIngredientItem(item: IngredientItem): Observable<void> {
    const id: string = item.id;
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<void>());
  }

  getIngredientItemById(id: string): Observable<IngredientItem> {
    return forkJoin({
      item: this.http.get<ApiResponse<IngredientItemDTO>>(`${this.apiUrl}/${id}`).pipe(mapResponseData<IngredientItemDTO>()),
      units: this.unitService.getUnits(),
      locations: this.locationService.getLocations(),
    }).pipe(
      map(({ item, units, locations }) => {
        const unitMap = new Map(units.map((u) => [u.id, u]));
        const locationMap = new Map(locations.map((l) => [l.id, l]));
        return mapItemDTOToItem(item, unitMap, locationMap);
      }),
    );
  }

  updateIngredientItem(item: IngredientItem): Observable<IngredientItemDTO> {
    const id: string = item.id;
    const itemDTO: UpdateIngredientItemDTO = mapItemToUpdateItemDTO(item);
    return this.http
      .put<ApiResponse<IngredientItemDTO>>(`${this.apiUrl}/${id}`, itemDTO)
      .pipe(mapResponseData<IngredientItemDTO>());
  }

  // Legacy Aliases
  getItems(): Observable<IngredientItem[]> {
    return this.getIngredientItems();
  }

  addItem(item: IngredientItem): Observable<IngredientItemDTO> {
    return this.addIngredientItem(item);
  }

  removeItem(item: IngredientItem): Observable<void> {
    return this.removeIngredientItem(item);
  }

  getItemById(id: string): Observable<IngredientItem> {
    return this.getIngredientItemById(id);
  }

  updateItem(item: IngredientItem): Observable<IngredientItemDTO> {
    return this.updateIngredientItem(item);
  }
}
