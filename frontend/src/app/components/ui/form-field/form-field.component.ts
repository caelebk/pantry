import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pantry-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-1.5 w-full">
      @if (label() || badge()) {
        <div class="flex items-center justify-between h-5">
          @if (label()) {
            <label
              [attr.for]="forId()"
              class="block text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider select-none">
              {{ label() }}
              @if (required()) {
                <span class="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                <span class="sr-only">(required)</span>
              }
            </label>
          }
          @if (badge()) {
            <span
              class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              {{ badge() }}
            </span>
          }
        </div>
      }

      <div class="w-full">
        <ng-content></ng-content>
      </div>

      @if (error()) {
        <p class="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1" role="alert">
          <i class="pi pi-exclamation-circle text-xs" aria-hidden="true"></i>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p class="text-[11px] text-surface-400 dark:text-surface-500 mt-1">
          {{ hint() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  label = input<string>();
  forId = input<string>();
  required = input<boolean>(false);
  hint = input<string>();
  error = input<string>();
  badge = input<string>();
}
