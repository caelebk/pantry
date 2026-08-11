import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const activeKitchen = authService.activeKitchen();

  let reqHeaders = req.headers;
  if (token) {
    reqHeaders = reqHeaders.set('Authorization', `Bearer ${token}`);
  }
  if (activeKitchen) {
    reqHeaders = reqHeaders.set('X-Kitchen-Id', activeKitchen.id);
  }

  const authReq = req.clone({
    headers: reqHeaders,
    withCredentials: true,
  });

  return next(authReq).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshSession().pipe(
      switchMap((refreshRes) => {
        isRefreshing = false;
        refreshTokenSubject.next(refreshRes.accessToken);

        const newAuthReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${refreshRes.accessToken}`,
          },
        });
        return next(newAuthReq);
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.clearAuthState();
        return throwError(() => err);
      }),
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((t) => t !== null),
      take(1),
      switchMap((newToken) => {
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`,
          },
        });
        return next(retryReq);
      }),
    );
  }
}
