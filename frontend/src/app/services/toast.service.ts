import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly transloco = inject(TranslocoService);
  private readonly toasts$ = new BehaviorSubject<Toast[]>([]);

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration ?? (toast.type === 'error' ? 0 : 4000),
    };

    this.toasts$.next([...this.toasts$.value, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }
  }

  private t(key: 'success' | 'error' | 'warning' | 'info'): string {
    return this.transloco.translate(`common.${key}`);
  }

  showSuccess(message: string, title?: string): void {
    this.show({ type: 'success', title: title ?? this.t('success'), message });
  }

  showError(message: string, title?: string): void {
    this.show({ type: 'error', title: title ?? this.t('error'), message, duration: 0 });
  }

  showWarning(message: string, title?: string): void {
    this.show({ type: 'warning', title: title ?? this.t('warning'), message });
  }

  showInfo(message: string, title?: string): void {
    this.show({ type: 'info', title: title ?? this.t('info'), message });
  }

  remove(id: string): void {
    this.toasts$.next(this.toasts$.value.filter((t) => t.id !== id));
  }
}
