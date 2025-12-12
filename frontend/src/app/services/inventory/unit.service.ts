import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
    private readonly apiUrl = 'http://localhost:8000/api/units';

    constructor(private http: HttpClient) { }

    getUnits(): Observable<string[]> {
        return this.http.get<string[]>(this.apiUrl);
    }

    getUnitsById(id: number): Observable<string> {
        return this.http.get<string>(`${this.apiUrl}/${id}`);
    }

    convertUnits(quantity: number, fromUnitId: number, toUnitId: number): Observable<number> {
        const urlParams = new URLSearchParams({
            quantity: quantity.toString(),
            fromUnit: fromUnitId.toString(),
            toUnit: toUnitId.toString()
        });
        return this.http.get<number>(`${this.apiUrl}/convert?${urlParams.toString()}`);
    }
}
