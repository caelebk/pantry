import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { Unit, UnitDTO } from '@models/unit.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { mapUnitDTOToUnit } from '@utility/itemUtility/UnitMapper';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/v1/units';
  private unitsCache$?: Observable<Unit[]>;
  private cacheKitchenId?: string;

  private get activeKitchenId(): string {
    return this.authService.activeKitchen()?.id ?? '';
  }

  getUnits(): Observable<Unit[]> {
    const kitchenId = this.activeKitchenId;
    if (!this.unitsCache$ || this.cacheKitchenId !== kitchenId) {
      this.cacheKitchenId = kitchenId;
      this.unitsCache$ = this.http.get<ApiResponse<UnitDTO[]>>(this.apiUrl).pipe(
        mapResponseData(),
        map((dtos) => dtos.map(mapUnitDTOToUnit)),
        shareReplay(1),
      );
    }
    return this.unitsCache$;
  }

  getUnitsById(id: number): Observable<Unit> {
    return this.http
      .get<ApiResponse<UnitDTO>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData(), map(mapUnitDTOToUnit));
  }

  convertUnits(quantity: number, fromUnitId: number, toUnitId: number): Observable<number> {
    const urlParams = new URLSearchParams({
      quantity: quantity.toString(),
      fromUnit: fromUnitId.toString(),
      toUnit: toUnitId.toString(),
    });
    return this.http
      .get<ApiResponse<number>>(`${this.apiUrl}/convert?${urlParams.toString()}`)
      .pipe(mapResponseData());
  }
}
