import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Category } from "@models/category.model";
import { ApiResponse } from "@models/http.model";
import { mapResponseData } from "@utility/httpUtility/HttpResponse.operator";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class CategoryService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = "http://localhost:8000/api/categories";

    getCategories(): Observable<Category[]> {
        return this.http
            .get<ApiResponse<Category[]>>(this.apiUrl)
            .pipe(mapResponseData<Category[]>());
    }

    getCategoryById(id: number): Observable<Category> {
        return this.http
            .get<ApiResponse<Category>>(`${this.apiUrl}/${id}`)
            .pipe(mapResponseData<Category>());
    }
}
