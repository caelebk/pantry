import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { Location, LocationDTO } from '@models/location.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { mapLocationDTOToLocation } from '@utility/itemUtility/LocationMapper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/locations';

  getLocations(): Observable<Location[]> {
    return this.http.get<ApiResponse<LocationDTO[]>>(this.apiUrl).pipe(
      mapResponseData(),
      map((dtos) => dtos.map(mapLocationDTOToLocation)),
    );
  }

  getLocationById(id: number): Observable<Location> {
    return this.http
      .get<ApiResponse<LocationDTO>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData(), map(mapLocationDTOToLocation));
  }
}
