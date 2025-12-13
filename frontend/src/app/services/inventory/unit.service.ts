import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UnitDTO } from '../../models/unit.model';
import { ApiResponse } from '../../models/http.model';
import { mapResponseData } from '../../utility/HttpResponse.operator';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
    private readonly apiUrl = 'http://localhost:8000/api/units';

    constructor(private http: HttpClient) { }

    getUnits(): Observable<UnitDTO[]> {
        return this.http.get<ApiResponse<UnitDTO[]>>(this.apiUrl).pipe(mapResponseData());
    }

    getUnitsById(id: number): Observable<string> {
        return this.http.get<ApiResponse<string>>(`${this.apiUrl}/${id}`).pipe(mapResponseData());
    }

    convertUnits(quantity: number, fromUnitId: number, toUnitId: number): Observable<number> {
        const urlParams = new URLSearchParams({
            quantity: quantity.toString(),
            fromUnit: fromUnitId.toString(),
            toUnit: toUnitId.toString()
        });
        return this.http.get<ApiResponse<number>>(`${this.apiUrl}/convert?${urlParams.toString()}`).pipe(mapResponseData());
    }
}
