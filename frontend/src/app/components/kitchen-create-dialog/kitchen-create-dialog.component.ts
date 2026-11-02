import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, model, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { FormFieldComponent, SpinnerComponent } from '@ui';
import { DialogModule } from 'primeng/dialog';
import { Kitchen } from '../../core/models/auth.model';
import { KitchenService } from '../../core/services/kitchen.service';
import { ToastService } from '../../services/toast.service';

let nextDialogId = 0;

@Component({
  selector: 'pantry-kitchen-create-dialog',
  standalone: true,
  imports: [
    DialogModule,
    ReactiveFormsModule,
    TranslocoModule,
    FormFieldComponent,
    SpinnerComponent,
  ],
  template: `
    <p-dialog
      [header]="'kitchenCreate.title' | transloco"
      [visible]="visible()"
      (visibleChange)="onVisibilityChange($event)"
      (onShow)="focusName()"
      (onHide)="restoreFocus()"
      appendTo="body"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [blockScroll]="true"
      [closable]="!pending()"
      [closeOnEscape]="!pending()"
      [closeAriaLabel]="'kitchenCreate.cancel' | transloco"
      [style]="{ width: 'min(28rem, calc(100vw - 2rem))', maxHeight: 'calc(100dvh - 2rem)' }">
      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="space-y-5 pt-2 min-w-0"
        [attr.aria-busy]="pending()">
        <pantry-form-field
          [label]="'kitchenCreate.name' | transloco"
          [forId]="nameId"
          [required]="true"
          [error]="
            form.controls.name.touched && form.controls.name.invalid
              ? ('kitchenCreate.nameRequired' | transloco)
              : ''
          ">
          <input
            [id]="nameId"
            type="text"
            formControlName="name"
            required
            [readOnly]="pending()"
            [placeholder]="'kitchenCreate.namePlaceholder' | transloco"
            class="w-full h-[42px] px-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" />
        </pantry-form-field>
        <pantry-form-field
          [label]="'kitchenCreate.description' | transloco"
          [forId]="descriptionId">
          <input
            [id]="descriptionId"
            type="text"
            formControlName="description"
            [readOnly]="pending()"
            [placeholder]="'kitchenCreate.descriptionPlaceholder' | transloco"
            class="w-full h-[42px] px-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" />
        </pantry-form-field>
        @if (errorKey()) {
          <p role="alert" class="type-body text-rose-600 dark:text-rose-400 break-words">
            {{ errorKey() | transloco }}
          </p>
        }
        <div class="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            [disabled]="pending()"
            (click)="onVisibilityChange(false)"
            class="btn-secondary">
            {{ 'kitchenCreate.cancel' | transloco }}
          </button>
          <button type="submit" [disabled]="pending()" class="btn-primary">
            @if (pending()) {
              <pantry-spinner size="sm" />
            }
            {{ (pending() ? 'kitchenCreate.creating' : 'kitchenCreate.create') | transloco }}
          </button>
        </div>
      </form>
    </p-dialog>
  `,
})
export class KitchenCreateDialogComponent {
  readonly visible = model(false);
  readonly returnFocusTo = input<HTMLElement | null>(null);
  readonly created = output<Kitchen>();
  readonly pending = signal(false);
  readonly errorKey = signal('');
  readonly nameId = `create-kitchen-name-${nextDialogId++}`;
  readonly descriptionId = `${this.nameId}-description`;
  private readonly document = inject(DOCUMENT);
  private readonly kitchenService = inject(KitchenService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private opener: HTMLElement | null = null;
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.opener = this.returnFocusTo() ?? (this.document.activeElement as HTMLElement | null);
      }
    });
  }

  focusName() {
    this.document.getElementById(this.nameId)?.focus();
  }

  onVisibilityChange(visible: boolean) {
    if (!visible && this.pending()) return;
    this.visible.set(visible);
  }

  restoreFocus() {
    const target = this.returnFocusTo() ?? this.opener;
    if (!target?.isConnected || target.closest('[inert],[hidden]')) return;
    for (let element: HTMLElement | null = target; element; element = element.parentElement) {
      const style = this.document.defaultView?.getComputedStyle(element);
      if (style?.display === 'none' || style?.visibility === 'hidden') return;
    }
    target.focus();
  }

  submit() {
    if (this.pending()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.focusName();
      return;
    }
    this.pending.set(true);
    this.errorKey.set('');
    const { name, description } = this.form.getRawValue();
    this.kitchenService
      .createKitchen(name.trim(), description.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (kitchen) => {
          this.pending.set(false);
          this.visible.set(false);
          this.form.reset();
          this.toastService.showSuccess(
            this.transloco.translate('kitchenCreate.successDetail'),
            this.transloco.translate('kitchenCreate.success'),
          );
          this.created.emit(kitchen);
        },
        error: (error) => {
          this.pending.set(false);
          this.errorKey.set(
            error.status === 403 ? 'kitchenCreate.forbidden' : 'kitchenCreate.failure',
          );
        },
      });
  }
}
