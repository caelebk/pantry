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
import { map, shareReplay, tap } from 'rxjs/operators';
import { LocationService } from './location.service';
import { UnitService } from './unit.service';

export interface ItemSimilarityCandidate {
  item: IngredientItem;
  score: number;
  tier: 'exact' | 'similar';
}

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly apiUrl = '/api/v1/ingredient-items';
  private ingredientItemsCache$?: Observable<IngredientItem[]>;

  getSimilarIngredientItems(name: string, minScore = 0.45): Observable<ItemSimilarityCandidate[]> {
    return forkJoin({
      candidates: this.http
        .get<
          ApiResponse<
            {
              item: IngredientItemDTO;
              score: number;
              tier: 'exact' | 'similar';
            }[]
          >
        >(`${this.apiUrl}/similarity`, {
          params: { name, minScore: minScore.toString() },
        })
        .pipe(
          mapResponseData<
            {
              item: IngredientItemDTO;
              score: number;
              tier: 'exact' | 'similar';
            }[]
          >(),
        ),
      units: this.unitService.getUnits(),
      locations: this.locationService.getLocations(),
    }).pipe(
      map(({ candidates, units, locations }) => {
        const unitMap = new Map(units.map((u) => [u.id, u]));
        const locationMap = new Map(locations.map((l) => [l.id, l]));

        return candidates.map((c) => ({
          item: mapItemDTOToItem(c.item, unitMap, locationMap),
          score: c.score,
          tier: c.tier,
        }));
      }),
    );
  }

  getIngredientItems(): Observable<IngredientItem[]> {
    if (!this.ingredientItemsCache$) {
      this.ingredientItemsCache$ = forkJoin({
        items: this.http
          .get<ApiResponse<IngredientItemDTO[]>>(this.apiUrl)
          .pipe(mapResponseData<IngredientItemDTO[]>()),
        units: this.unitService.getUnits(),
        locations: this.locationService.getLocations(),
      }).pipe(
        map(({ items, units, locations }) => {
          const unitMap = new Map(units.map((u) => [u.id, u]));
          const locationMap = new Map(locations.map((l) => [l.id, l]));

          return items.map((item: IngredientItemDTO) =>
            mapItemDTOToItem(item, unitMap, locationMap),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.ingredientItemsCache$;
  }

  addIngredientItem(item: IngredientItem): Observable<IngredientItemDTO> {
    const itemDTO = mapItemToItemDTO(item);
    return this.http.post<ApiResponse<IngredientItemDTO>>(this.apiUrl, itemDTO).pipe(
      mapResponseData<IngredientItemDTO>(),
      tap(() => this.clearIngredientItemsCache()),
    );
  }

  removeIngredientItem(item: IngredientItem): Observable<void> {
    const id: string = item.id;
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      mapResponseData<void>(),
      tap(() => this.clearIngredientItemsCache()),
    );
  }

  getIngredientItemById(id: string): Observable<IngredientItem> {
    return forkJoin({
      item: this.http
        .get<ApiResponse<IngredientItemDTO>>(`${this.apiUrl}/${id}`)
        .pipe(mapResponseData<IngredientItemDTO>()),
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
    return this.http.put<ApiResponse<IngredientItemDTO>>(`${this.apiUrl}/${id}`, itemDTO).pipe(
      mapResponseData<IngredientItemDTO>(),
      tap(() => this.clearIngredientItemsCache()),
    );
  }

  bulkClearStock(ids: string[]): Observable<{ clearedCount: number }> {
    return this.http
      .post<ApiResponse<{ clearedCount: number }>>(`${this.apiUrl}/bulk-clear-stock`, { ids })
      .pipe(
        mapResponseData<{ clearedCount: number }>(),
        tap(() => this.clearIngredientItemsCache()),
      );
  }

  bulkDeleteItems(ids: string[]): Observable<{ deletedCount: number }> {
    return this.http
      .post<ApiResponse<{ deletedCount: number }>>(`${this.apiUrl}/bulk-delete`, { ids })
      .pipe(
        mapResponseData<{ deletedCount: number }>(),
        tap(() => this.clearIngredientItemsCache()),
      );
  }

  private clearIngredientItemsCache(): void {
    this.ingredientItemsCache$ = undefined;
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
