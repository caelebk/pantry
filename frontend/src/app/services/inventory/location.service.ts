import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocationDTO, Location } from '@models/location.model';
import { mapLocationDTOToLocation } from '@utility/itemUtility/LocationMapper';
import { ApiResponse } from '@models/http.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
    private readonly apiUrl = 'http://localhost:8000/api/locations';

  constructor(private http: HttpClient) { }

  getLocations(): Observable<Location[]> {
    return this.http.get<ApiResponse<LocationDTO[]>>(this.apiUrl).pipe(
        mapResponseData(),
        map(dtos => dtos.map(mapLocationDTOToLocation))
    );
  }

  getLocationById(id: number): Observable<Location> {
    return this.http.get<ApiResponse<LocationDTO>>(`${this.apiUrl}/${id}`).pipe(mapResponseData(), map(mapLocationDTOToLocation));
  }
}
