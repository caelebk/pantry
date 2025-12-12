import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocationDTO } from '../../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
    private readonly apiUrl = 'http://localhost:8000/api/locations';

  constructor(private http: HttpClient) { }

  getLocations(): Observable<LocationDTO[]> {
    return this.http.get<LocationDTO[]>(this.apiUrl);
  }

  getLocationById(id: number): Observable<LocationDTO> {
    return this.http.get<LocationDTO>(`${this.apiUrl}/${id}`);
  }
}
