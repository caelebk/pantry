import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'pantry-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      @for (toast of toasts$ | async; track toast.id) {
        <div
          [class]="
            'pointer-events-auto rounded-2xl p-4 shadow-2xl border transition-all duration-300 transform translate-y-0 flex items-start gap-3 ' +
            getToastClass(toast.type)
          ">
          <!-- Icon -->
          <div class="shrink-0 mt-0.5">
            @switch (toast.type) {
              @case ('success') {
                <div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              }
              @case ('error') {
                <div class="w-7 h-7 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
              }
              @case ('warning') {
                <div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
              }
              @default {
                <div class="w-7 h-7 rounded-full bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </div>
              }
            }
          </div>

          <!-- Message Body -->
          <div class="flex-1 min-w-0">
            @if (toast.title) {
              <h5 class="text-sm font-extrabold text-gray-900 dark:text-white leading-tight mb-0.5">
                {{ toast.title }}
              </h5>
            }
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-normal">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            (click)="dismiss(toast.id)"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
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
        return 'bg-white dark:bg-[#1a1a1a] border-emerald-500/30 text-emerald-950 dark:text-emerald-100';
      case 'error':
        return 'bg-white dark:bg-[#1a1a1a] border-rose-500/30 text-rose-950 dark:text-rose-100';
      case 'warning':
        return 'bg-white dark:bg-[#1a1a1a] border-amber-500/30 text-amber-950 dark:text-amber-100';
      default:
        return 'bg-white dark:bg-[#1a1a1a] border-primary-500/30 text-primary-950 dark:text-primary-100';
    }
  }

  dismiss(id: string): void {
    this.toastService.remove(id);
  }
}
