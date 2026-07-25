import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiResponse } from "@models/http.model";
import { NutrientType } from "@models/nutrient-type.model";
import { mapResponseData } from "@utility/httpUtility/HttpResponse.operator";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class NutrientTypeService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = "http://localhost:8000/api/nutrient-types";

    getNutrientTypes(): Observable<NutrientType[]> {
        return this.http
            .get<ApiResponse<NutrientType[]>>(this.apiUrl)
            .pipe(mapResponseData<NutrientType[]>());
    }

    getNutrientTypeById(id: number): Observable<NutrientType> {
        return this.http
            .get<ApiResponse<NutrientType>>(`${this.apiUrl}/${id}`)
            .pipe(mapResponseData<NutrientType>());
    }
}
