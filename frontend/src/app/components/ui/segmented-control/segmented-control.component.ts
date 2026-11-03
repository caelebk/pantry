import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
} from '@angular/core';

export interface SegmentedOption<T = string> {
  value: T;
  label: string;
  icon?: string;
}

/** Single-select radio group. Two-way bind with `[(value)]`. Arrow keys move and select. */
@Component({
  selector: 'pantry-segmented-control',
  standalone: true,
  template: `
    <div
      role="radiogroup"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
      class="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
      @for (option of options(); track option.value; let i = $index) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="isSelected(option.value)"
          [attr.tabindex]="tabIndexFor(i)"
          [disabled]="disabled()"
          (click)="select(option.value)"
          (keydown)="onKeydown($event, i)"
          [class]="optionClasses(isSelected(option.value))">
          @if (option.icon) {
            <i [class]="option.icon" aria-hidden="true"></i>
          }
          <span>{{ option.label }}</span>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControlComponent<T = string> {
  options = input.required<SegmentedOption<T>[]>();
  value = model<T | undefined>(undefined);
  disabled = input<boolean>(false);
  ariaLabel = input<string>();
  ariaLabelledBy = input<string>();

  /** The selected option is the tab stop; with no selection the first option is. */
  private activeIndex = computed(() => {
    const index = this.options().findIndex((o) => o.value === this.value());
    return index === -1 ? 0 : index;
  });

  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  isSelected(value: T): boolean {
    return value === this.value();
  }

  tabIndexFor(index: number): number {
    return index === this.activeIndex() ? 0 : -1;
  }

  select(value: T): void {
    if (!this.disabled()) {
      this.value.set(value);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.options().length;
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = (index + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = (index - 1 + count) % count;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(this.options()[target].value);
    const buttons = this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]');
    buttons[target]?.focus();
  }

  optionClasses(selected: boolean): string {
    const base =
      'inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60';
    return selected
      ? `${base} bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 border border-primary-500/20`
      : `${base} border border-transparent text-surface-600 dark:text-surface-300 hover:bg-surface-200/50 dark:hover:bg-white/10`;
  }
}
