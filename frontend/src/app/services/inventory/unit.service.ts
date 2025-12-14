import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UnitDTO, Unit } from '@models/unit.model';
import { mapUnitDTOToUnit } from '@utility/itemUtility/UnitMapper';
import { ApiResponse } from '@models/http.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
    private readonly apiUrl = 'http://localhost:8000/api/units';

    constructor(private http: HttpClient) { }

    getUnits(): Observable<Unit[]> {
        return this.http.get<ApiResponse<UnitDTO[]>>(this.apiUrl).pipe(
            mapResponseData(),
            map(dtos => dtos.map(mapUnitDTOToUnit))
        );
    }

    getUnitsById(id: number): Observable<Unit> {
        return this.http.get<ApiResponse<UnitDTO>>(`${this.apiUrl}/${id}`).pipe(mapResponseData(), map(mapUnitDTOToUnit));
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
