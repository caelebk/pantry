import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmDialogService } from './confirm-dialog.service';

/** Moves focus to the host element when it first renders (the safe button of a confirmation). */
@Directive({
  selector: '[pantryConfirmFocus]',
  standalone: true,
})
export class ConfirmFocusDirective {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef);
    // Deferred so the overlay is attached and PrimeNG's focus trap has settled.
    afterNextRender(() => setTimeout(() => el.nativeElement.focus()));
  }
}

/**
 * Mount once per page, then call `ConfirmDialogService.confirm(...)`.
 * Cancel is first in the focus order and receives initial focus; Escape and backdrop cancel.
 */
@Component({
  selector: 'pantry-confirm-dialog',
  standalone: true,
  imports: [ConfirmDialogModule, ConfirmFocusDirective],
  providers: [
    {
      provide: ConfirmationService,
      useFactory: () => inject(ConfirmDialogService).confirmationService,
    },
  ],
  template: `
    <p-confirmDialog key="pantry-confirm" [dismissableMask]="true" defaultFocus="none">
      <ng-template #headless let-message let-onAccept="onAccept" let-onReject="onReject">
        @if (message) {
          <div
            class="glass-card rounded-2xl p-6 max-w-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pantry-confirm-title"
            aria-describedby="pantry-confirm-message">
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                [class]="
                  message.acceptButtonStyleClass === 'btn-danger'
                    ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                    : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                ">
                <i [class]="message.icon + ' text-xl'" aria-hidden="true"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h3
                  id="pantry-confirm-title"
                  class="type-section-title text-surface-900 dark:text-white mb-2">
                  {{ message.header }}
                </h3>
                <p
                  id="pantry-confirm-message"
                  class="text-surface-600 dark:text-surface-300 text-sm mb-6">
                  {{ message.message }}
                </p>
                <div class="flex gap-3 justify-end">
                  <button
                    type="button"
                    pantryConfirmFocus
                    (click)="onReject()"
                    class="btn-secondary">
                    {{ message.rejectLabel }}
                  </button>
                  <button
                    type="button"
                    (click)="onAccept()"
                    [class]="message.acceptButtonStyleClass">
                    {{ message.acceptLabel }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </ng-template>
    </p-confirmDialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {}
