import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type EmptyStateVariant = 'glass' | 'plain';

@Component({
  selector: 'pantry-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center text-center p-8 transition-all"
      [class.glass-card]="variant() === 'glass'"
      [class.rounded-2xl]="variant() === 'glass'"
      [class.border]="variant() === 'glass'"
      [class.border-surface-200/80]="variant() === 'glass'"
      [class.dark:border-surface-800/80]="variant() === 'glass'">
      <div
        class="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-400 dark:text-surface-500 mb-4 shadow-inner">
        <i [class]="icon() + ' text-2xl'" aria-hidden="true"></i>
      </div>
      <h4 class="text-base font-bold text-surface-900 dark:text-white mb-1 tracking-tight">
        {{ title() }}
      </h4>
      @if (description()) {
        <p class="text-xs text-surface-500 dark:text-surface-400 max-w-sm mb-5 leading-relaxed">
          {{ description() }}
        </p>
      }
      <ng-content select="[actions]"></ng-content>
      @if (actionText()) {
        <button
          type="button"
          (click)="actionClick.emit()"
          class="btn-primary inline-flex items-center gap-2 cursor-pointer">
          @if (actionIcon()) {
            <i [class]="actionIcon()" aria-hidden="true"></i>
          }
          <span>{{ actionText() }}</span>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  icon = input<string>('pi pi-inbox');
  title = input.required<string>();
  description = input<string>();
  actionText = input<string>();
  actionIcon = input<string>();
  variant = input<EmptyStateVariant>('glass');

  actionClick = output<void>();
}
