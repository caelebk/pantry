import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  AuthResponse,
  Kitchen,
  LoginRequest,
  RefreshResponse,
  SignupRequest,
  User,
  UserProfileResponse,
  UserSession,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = '/api/v1';

  // Reactive State Signals (Angular 20 Standalone)
  readonly currentUser = signal<User | null>(null);
  readonly activeKitchen = signal<Kitchen | null>(null);
  readonly userKitchens = signal<Kitchen[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);

  readonly isAuthenticated = computed(() => !!this.currentUser());

  // In-Memory Access Token Storage (Never written to localStorage/sessionStorage for OWASP security)
  private accessToken: string | null = null;

  // Silent Refresh Queueing State
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Initializes session on application startup via silent refresh call.
   */
  initializeAuth(): Observable<boolean> {
    this.isLoading.set(true);
    return this.refreshSession().pipe(
      switchMap(() => this.fetchProfile()),
      map(() => true),
      catchError(() => {
        this.clearAuthState();
        return of(false);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.isInitialized.set(true);
      }),
    );
  }

  signup(request: SignupRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<{
        status: string;
        data: AuthResponse;
      }>(`${this.apiUrl}/auth/signup`, request, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        switchMap((data) => {
          this.setAccessToken(data.accessToken);
          this.currentUser.set(data.user);
          return this.fetchProfile().pipe(
            map(() => data),
            catchError(() => of(data)),
          );
        }),
        finalize(() => this.isLoading.set(false)),
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<{
        status: string;
        data: AuthResponse;
      }>(`${this.apiUrl}/auth/login`, request, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        switchMap((data) => {
          this.setAccessToken(data.accessToken);
          this.currentUser.set(data.user);
          return this.fetchProfile().pipe(
            map(() => data),
            catchError(() => of(data)),
          );
        }),
        finalize(() => this.isLoading.set(false)),
      );
  }

  refreshSession(): Observable<RefreshResponse> {
    return this.http
      .post<{
        status: string;
        data: RefreshResponse;
      }>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => res.data),
        tap((data) => {
          this.setAccessToken(data.accessToken);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      finalize(() => {
        this.clearAuthState();
        this.router.navigate(['/auth/login']);
      }),
    );
  }

  fetchProfile(): Observable<UserProfileResponse> {
    return this.http
      .get<{ status: string; data: UserProfileResponse }>(`${this.apiUrl}/me/profile`)
      .pipe(
        map((res) => res.data),
        tap((data) => {
          this.currentUser.set(data.user);
          this.userKitchens.set(data.memberships);

          const savedKitchenId = localStorage.getItem('activeKitchenId');
          let matchingKitchen = data.memberships.find((k) => k.id === savedKitchenId);

          if (!matchingKitchen) {
            const primaryId = data.user.primaryKitchenId;
            matchingKitchen =
              data.memberships.find((k) => k.id === primaryId) || data.memberships[0] || null;
          }
          this.activeKitchen.set(matchingKitchen);
        }),
      );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http
      .patch<{ status: string; data: { user: User } }>(`${this.apiUrl}/me/profile`, data)
      .pipe(
        map((res) => res.data.user),
        tap((updatedUser) => {
          this.currentUser.set(updatedUser);
        }),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/password`, { currentPassword, newPassword }).pipe(
      tap(() => {
        this.clearAuthState();
        this.router.navigate(['/auth/login']);
      }),
    );
  }

  getActiveSessions(): Observable<UserSession[]> {
    return this.http
      .get<{ status: string; data: UserSession[] }>(`${this.apiUrl}/me/sessions`)
      .pipe(map((res) => res.data));
  }

  revokeAllSessions(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/sessions/revoke-all`, {}).pipe(
      tap(() => {
        this.clearAuthState();
        this.router.navigate(['/auth/login']);
      }),
    );
  }

  setActiveKitchen(kitchen: Kitchen): void {
    this.activeKitchen.set(kitchen);
    localStorage.setItem('activeKitchenId', kitchen.id);
  }

  clearAuthState(): void {
    this.accessToken = null;
    this.currentUser.set(null);
    this.activeKitchen.set(null);
    this.userKitchens.set([]);
    localStorage.removeItem('activeKitchenId');
  }
}
