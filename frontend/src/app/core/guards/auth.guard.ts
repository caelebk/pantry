import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Waits for AuthService initialization to complete before evaluating.
 * Prevents the race condition where guards fire before provideAppInitializer
 * finishes the silent refresh call, which would incorrectly redirect
 * authenticated users to the login page.
 */
function waitForAuthInit(authService: AuthService): Observable<boolean> {
  return new Observable<boolean>((subscriber) => {
    if (authService.isInitialized()) {
      subscriber.next(true);
      subscriber.complete();
      return;
    }

    const interval = setInterval(() => {
      if (authService.isInitialized()) {
        clearInterval(interval);
        subscriber.next(true);
        subscriber.complete();
      }
    }, 50);

    // Safety timeout: don't block forever (5 seconds max)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      subscriber.next(true);
      subscriber.complete();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  });
}

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Observable<boolean | import('@angular/router').UrlTree>((subscriber) => {
    waitForAuthInit(authService).subscribe(() => {
      if (authService.isAuthenticated()) {
        subscriber.next(true);
      } else {
        subscriber.next(router.createUrlTree(['/auth/login']));
      }
      subscriber.complete();
    });
  });
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return new Observable<boolean | import('@angular/router').UrlTree>((subscriber) => {
    waitForAuthInit(authService).subscribe(() => {
      if (!authService.isAuthenticated()) {
        subscriber.next(true);
      } else {
        subscriber.next(router.createUrlTree(['/']));
      }
      subscriber.complete();
    });
  });
};
