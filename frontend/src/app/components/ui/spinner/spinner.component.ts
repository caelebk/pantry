import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'surface';
export type SpinnerLayout = 'inline' | 'stacked';

@Component({
  selector: 'pantry-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="inline-flex items-center justify-center"
      [class.flex-col]="layout() === 'stacked'"
      [class.gap-2]="layout() === 'stacked' || (label() && layout() === 'inline')"
      role="status"
      aria-live="polite">
      <svg
        [class]="spinnerClasses()"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      @if (label()) {
        <span [class]="labelClasses()">{{ label() }}</span>
      }
      <span class="sr-only">{{ label() || 'Loading...' }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  size = input<SpinnerSize>('md');
  color = input<SpinnerColor>('primary');
  layout = input<SpinnerLayout>('inline');
  label = input<string>();

  spinnerClasses = computed(() => {
    const sizeMap: Record<SpinnerSize, string> = {
      xs: 'h-3.5 w-3.5',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-8 w-8',
    };

    const colorMap: Record<SpinnerColor, string> = {
      primary: 'text-primary-600 dark:text-primary-500',
      white: 'text-white',
      surface: 'text-surface-500 dark:text-surface-400',
    };

    return `animate-spin ${sizeMap[this.size()]} ${colorMap[this.color()]}`;
  });

  labelClasses = computed(() => {
    const textMap: Record<SpinnerSize, string> = {
      xs: 'text-xs text-surface-500 dark:text-surface-400',
      sm: 'text-xs font-medium text-surface-500 dark:text-surface-400',
      md: 'text-sm font-medium text-surface-600 dark:text-surface-400',
      lg: 'text-base font-semibold text-surface-700 dark:text-surface-300',
    };
    return textMap[this.size()];
  });
}
