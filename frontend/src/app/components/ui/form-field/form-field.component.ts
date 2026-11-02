import { CommonModule } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  input,
} from '@angular/core';
import { NgControl } from '@angular/forms';

let nextFieldId = 0;

@Component({
  selector: 'pantry-form-field',
  standalone: true,
  host: { class: 'block' },
  imports: [CommonModule],
  template: `
    <div class="space-y-1.5 w-full">
      @if (label() || badge()) {
        <div class="flex items-start justify-between min-h-5 gap-2">
          @if (label()) {
            <label
              [attr.for]="forId()"
              class="type-label min-w-0 break-words block text-surface-600 dark:text-surface-300 select-none">
              {{ label() }}
              @if (required()) {
                <span class="text-rose-500 ml-0.5" aria-hidden="true">*</span>
                <span class="sr-only">(required)</span>
              }
            </label>
          }
          @if (badge()) {
            <span
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              {{ badge() }}
            </span>
          }
        </div>
      }

      <div class="w-full">
        <ng-content></ng-content>
      </div>

      @if (error()) {
        <p
          [id]="errorId()"
          class="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1"
          role="alert">
          <i class="pi pi-exclamation-circle text-xs" aria-hidden="true"></i>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p [id]="hintId()" class="type-meta text-surface-500 dark:text-surface-400 mt-1">
          {{ hint() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  private readonly generatedId = `pantry-field-${++nextFieldId}`;
  readonly hintId = computed(() => `${this.forId() || this.generatedId}-hint`);
  readonly errorId = computed(() => `${this.forId() || this.generatedId}-error`);
  private readonly controls = contentChildren(NgControl, { descendants: true, read: ElementRef });
  private readonly explicitControls = contentChildren('fieldControl', {
    descendants: true,
    read: ElementRef,
  });
  private readonly previous = new Map<
    HTMLElement,
    { descriptionId: string | null; invalid: string | null }
  >();

  constructor() {
    afterRenderEffect(() => {
      const descriptionId = this.error() ? this.errorId() : this.hint() ? this.hintId() : null;
      const invalid = !!this.error();
      const elements = [...this.controls(), ...this.explicitControls()].flatMap((ref) => {
        const host = ref.nativeElement as HTMLElement;
        const target = host.matches('input,textarea,select,[role="combobox"]')
          ? host
          : host.querySelector<HTMLElement>('[role="combobox"],input,textarea,select');
        return target ? [target] : [];
      });
      for (const [element, state] of this.previous) {
        if (!elements.includes(element)) {
          this.associate(element, state.descriptionId, null);
          this.restoreInvalid(element, state.invalid);
          this.previous.delete(element);
        }
      }
      for (const element of elements) {
        const state = this.previous.get(element) ?? {
          descriptionId: null,
          invalid: element.getAttribute('aria-invalid'),
        };
        this.associate(element, state.descriptionId, descriptionId);
        if (invalid) element.setAttribute('aria-invalid', 'true');
        else this.restoreInvalid(element, state.invalid);
        this.previous.set(element, { ...state, descriptionId });
      }
    });
  }

  private associate(element: HTMLElement, previous: string | null, next: string | null): void {
    const tokens = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    const descriptions = new Set(tokens.filter((token) => token !== previous));
    if (next) descriptions.add(next);
    if (descriptions.size) element.setAttribute('aria-describedby', [...descriptions].join(' '));
    else element.removeAttribute('aria-describedby');
  }

  private restoreInvalid(element: HTMLElement, value: string | null): void {
    if (value === null) element.removeAttribute('aria-invalid');
    else element.setAttribute('aria-invalid', value);
  }

  label = input<string>();
  forId = input<string>();
  required = input<boolean>(false);
  hint = input<string>();
  error = input<string>();
  badge = input<string>();
}
