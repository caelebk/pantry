import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pantry-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full" [class.opacity-60]="disabled()">
      <i
        class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"
        aria-hidden="true"></i>
      <input
        #inputElement
        type="text"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel()"
        (input)="onInput($event)"
        (keydown.escape)="clear()"
        class="w-full pl-10 pr-10 h-[42px] bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder:text-surface-400 shadow-xs disabled:cursor-not-allowed" />
      @if (value()) {
        <button
          type="button"
          (click)="clear()"
          [attr.aria-label]="clearAriaLabel()"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 cursor-pointer p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
          <i class="pi pi-times text-xs" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  value = model<string>('');
  placeholder = input<string>('Search...');
  disabled = input<boolean>(false);
  ariaLabel = input<string>('Search');
  clearAriaLabel = input<string>('Clear search');

  searchChange = output<string>();

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('inputElement');

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.searchChange.emit(val);
  }

  clear(): void {
    this.value.set('');
    this.searchChange.emit('');
    this.inputEl()?.nativeElement.focus();
  }
}
