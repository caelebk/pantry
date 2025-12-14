import { pipe, UnaryFunction, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../models/http.model';

export function mapResponseData<T>(): UnaryFunction<Observable<ApiResponse<T>>, Observable<T>> {
    return pipe(
        map((response: ApiResponse<T>) => response.data)
    );
}
