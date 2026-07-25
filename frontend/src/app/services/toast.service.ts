import { Injectable } from '@angular/core';
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
  private readonly toasts$ = new BehaviorSubject<Toast[]>([]);

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  show(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      duration: toast.duration ?? 4000,
      ...toast,
    };

    this.toasts$.next([...this.toasts$.value, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }
  }

  showSuccess(message: string, title: string = 'Success'): void {
    this.show({ type: 'success', title, message });
  }

  showError(message: string, title: string = 'Error'): void {
    this.show({ type: 'error', title, message, duration: 6000 });
  }

  showWarning(message: string, title: string = 'Warning'): void {
    this.show({ type: 'warning', title, message });
  }

  showInfo(message: string, title: string = 'Info'): void {
    this.show({ type: 'info', title, message });
  }

  remove(id: string): void {
    this.toasts$.next(this.toasts$.value.filter((t) => t.id !== id));
  }
}
