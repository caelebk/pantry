import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { Location, LocationDTO } from '@models/location.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { mapLocationDTOToLocation } from '@utility/itemUtility/LocationMapper';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/v1/locations';
  private locationsCache$?: Observable<Location[]>;
  private cacheKitchenId?: string;

  private get activeKitchenId(): string {
    return this.authService.activeKitchen()?.id ?? '';
  }

  getLocations(): Observable<Location[]> {
    const kitchenId = this.activeKitchenId;
    if (!this.locationsCache$ || this.cacheKitchenId !== kitchenId) {
      this.cacheKitchenId = kitchenId;
      this.locationsCache$ = this.http.get<ApiResponse<LocationDTO[]>>(this.apiUrl).pipe(
        mapResponseData(),
        map((dtos) => dtos.map(mapLocationDTOToLocation)),
        shareReplay(1),
      );
    }
    return this.locationsCache$;
  }

  getLocationById(id: number): Observable<Location> {
    return this.http
      .get<ApiResponse<LocationDTO>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData(), map(mapLocationDTOToLocation));
  }
}
