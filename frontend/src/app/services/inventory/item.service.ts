import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { Item, ItemDTO, UpdateItemDTO } from '@models/items.model';
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
  private readonly apiUrl = 'http://localhost:8000/api/items';

  constructor(
    private http: HttpClient,
    private unitService: UnitService,
    private locationService: LocationService
  ) {}

  getItems(): Observable<Item[]> {
    return forkJoin({
      items: this.http
        .get<ApiResponse<ItemDTO[]>>(this.apiUrl)
        .pipe(mapResponseData<ItemDTO[]>()),
      units: this.unitService.getUnits(),
      locations: this.locationService.getLocations(),
    }).pipe(
      map(({ items, units, locations }) => {
        const unitMap = new Map(units.map(u => [u.id, u]));
        const locationMap = new Map(locations.map(l => [l.id, l]));

        return items.map((item: ItemDTO) =>
          mapItemDTOToItem(item, unitMap, locationMap)
        );
      })
    );
  }

  addItem(item: Item): Observable<ItemDTO> {
    const itemDTO = mapItemToItemDTO(item);
    return this.http
      .post<ApiResponse<ItemDTO>>(this.apiUrl, itemDTO)
      .pipe(mapResponseData<ItemDTO>());
  }

  removeItem(item: Item): Observable<void> {
    const id: string = item.id;
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<void>());
  }

  updateItem(item: Item): Observable<ItemDTO> {
    const id: string = item.id;
    const itemDTO: UpdateItemDTO = mapItemToUpdateItemDTO(item);
    return this.http
      .put<ApiResponse<ItemDTO>>(`${this.apiUrl}/${id}`, itemDTO)
      .pipe(mapResponseData<ItemDTO>());
  }
}
