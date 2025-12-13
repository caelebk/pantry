import { Injectable } from '@angular/core';
import { Item, ItemDTO } from '@models/items.model';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UnitService } from './unit.service';
import { LocationService } from './location.service';
import { mapItemDTOToItem } from '@utility/itemUtility/ItemDTOMapper';
import { ApiResponse } from '@models/http.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly apiUrl = 'http://localhost:8000/api/items';

  constructor(
    private http: HttpClient,
    private unitService: UnitService,
    private locationService: LocationService
  ) { }

  getItems(): Observable<Item[]> {
    return forkJoin({
        items: this.http.get<ApiResponse<ItemDTO[]>>(this.apiUrl).pipe(mapResponseData<ItemDTO[]>()),
        units: this.unitService.getUnits(),
        locations: this.locationService.getLocations()
    }).pipe(
        map(({ items, units, locations }) => {
            const unitMap = new Map(units.map(u => [u.id, u.name]));
            const locationMap = new Map(locations.map(l => [l.id, l.name]));

            return items.map((item: ItemDTO) => mapItemDTOToItem(item, unitMap, locationMap));
        })
    );
  }

  addItem(item: Item) {
    
  }

  removeItem(item: Item) {
  }

  updateItem(oldItem: Item, newItem: Item) {
  }
}
