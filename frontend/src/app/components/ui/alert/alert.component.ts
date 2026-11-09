import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

/** Inline message. `danger` is announced assertively (`role="alert"`); the rest politely. */
@Component({
  selector: 'pantry-alert',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <div [class]="classes()" [attr.role]="role()">
      <i [class]="iconClass() + ' mt-0.5 shrink-0'" aria-hidden="true"></i>
      <div class="flex-1 min-w-0 space-y-0.5">
        @if (title()) {
          <p class="font-semibold">{{ title() }}</p>
        }
        <div class="text-sm"><ng-content></ng-content></div>
      </div>
      @if (dismissible()) {
        <button
          type="button"
          (click)="dismissed.emit()"
          [attr.aria-label]="dismissLabel() || ('common.dismiss' | transloco)"
          class="shrink-0 -m-1 p-1 rounded-md cursor-pointer opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
          <i class="pi pi-times text-xs" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  variant = input<AlertVariant>('info');
  title = input<string>();
  dismissible = input<boolean>(false);
  dismissLabel = input<string>();

  dismissed = output<void>();

  role = computed(() => (this.variant() === 'danger' ? 'alert' : 'status'));

  iconClass = computed(() => {
    const map: Record<AlertVariant, string> = {
      info: 'pi pi-info-circle',
      success: 'pi pi-check-circle',
      warning: 'pi pi-exclamation-triangle',
      danger: 'pi pi-times-circle',
    };
    return map[this.variant()];
  });

  classes = computed(() => {
    const map: Record<AlertVariant, string> = {
      info: 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700',
      success:
        'bg-emerald-50 dark:bg-[color-mix(in_srgb,var(--color-emerald-500)_10%,var(--color-surface-900))] text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      warning:
        'bg-amber-50 dark:bg-[color-mix(in_srgb,var(--color-amber-500)_10%,var(--color-surface-900))] text-amber-700 dark:text-amber-300 border-amber-500/20',
      danger:
        'bg-rose-50 dark:bg-[color-mix(in_srgb,var(--color-rose-500)_10%,var(--color-surface-900))] text-rose-700 dark:text-rose-300 border-rose-500/20',
    };
    return `flex items-start gap-3 p-3 rounded-xl border text-sm ${map[this.variant()]}`;
  });
}
