import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'pantry-toast-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="toast-stack fixed z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toasts$ | async; track toast.id) {
        <div
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
          aria-atomic="true"
          [class]="
            'toast-card pointer-events-auto rounded-xl p-4 shadow-xl border flex items-start gap-3 ' +
            getToastClass(toast.type)
          ">
          <!-- Icon -->
          <div
            [class]="
              'w-7 h-7 shrink-0 mt-0.5 rounded-full flex items-center justify-center ' +
              getIconClass(toast.type)
            "
            aria-hidden="true">
            <i [class]="getIconName(toast.type) + ' text-sm'"></i>
          </div>

          <!-- Message Body -->
          <div class="toast-message flex-1 min-w-0">
            @if (toast.title) {
              <p class="type-label text-surface-900 dark:text-white mb-0.5">
                {{ toast.title }}
              </p>
            }
            <p class="text-sm text-surface-600 dark:text-surface-300">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            (click)="dismiss(toast.id)"
            [attr.aria-label]="'COMMON.DISMISS_NOTIFICATION' | transloco"
            class="btn-icon-sm shrink-0">
            <i class="pi pi-times text-xs" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      right: max(1rem, env(safe-area-inset-right));
      bottom: max(1rem, env(safe-area-inset-bottom));
      width: min(24rem, calc(100vw - 2rem));
      max-height: calc(100dvh - 2rem);
      overflow-y: auto;
    }
    .toast-card {
      background: var(--color-surface-50);
    }
    :host-context(.dark) .toast-card {
      background: var(--color-surface-900);
    }
    .toast-message {
      overflow-wrap: anywhere;
    }
  `,
})
export class ToastContainerComponent implements OnInit {
  private readonly toastService = inject(ToastService);
  toasts$!: Observable<Toast[]>;

  ngOnInit(): void {
    this.toasts$ = this.toastService.getToasts();
  }

  getToastClass(type: string): string {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 text-emerald-950 dark:text-emerald-100';
      case 'error':
        return 'border-rose-500/20 text-rose-950 dark:text-rose-100';
      case 'warning':
        return 'border-amber-500/20 text-amber-950 dark:text-amber-100';
      default:
        return 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'error':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-surface-500/10 text-surface-700 dark:text-surface-300';
    }
  }

  getIconName(type: string): string {
    switch (type) {
      case 'success':
        return 'pi pi-check';
      case 'error':
        return 'pi pi-times-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      default:
        return 'pi pi-info-circle';
    }
  }

  dismiss(id: string): void {
    this.toastService.remove(id);
  }
}
