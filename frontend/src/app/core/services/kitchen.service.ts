import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Kitchen, KitchenMember } from '../models/auth.model';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = '/api/v1/kitchens';

  getKitchens(): Observable<Kitchen[]> {
    return this.http.get<{ status: string; data: Kitchen[] }>(this.apiUrl).pipe(
      map((res) => res.data),
      tap((kitchens) => {
        this.authService.userKitchens.set(kitchens);
      }),
    );
  }

  createKitchen(name: string, description?: string): Observable<Kitchen> {
    return this.http
      .post<{ status: string; data: Kitchen }>(this.apiUrl, { name, description })
      .pipe(
        map((res) => res.data),
        tap((newKitchen) => {
          const updatedList = [...this.authService.userKitchens(), newKitchen];
          this.authService.userKitchens.set(updatedList);
          this.authService.activeKitchen.set(newKitchen);
        }),
      );
  }

  getKitchenMembers(kitchenId: string): Observable<KitchenMember[]> {
    return this.http
      .get<{ status: string; data: { members: KitchenMember[] } }>(`${this.apiUrl}/${kitchenId}`)
      .pipe(map((res) => res.data.members));
  }

  inviteMember(
    kitchenId: string,
    email: string,
    role: 'owner' | 'editor' | 'viewer',
  ): Observable<KitchenMember> {
    return this.http
      .post<{
        status: string;
        data: KitchenMember;
      }>(`${this.apiUrl}/${kitchenId}/members`, { email, role })
      .pipe(map((res) => res.data));
  }

  removeMember(kitchenId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${kitchenId}/members/${userId}`);
  }
}
