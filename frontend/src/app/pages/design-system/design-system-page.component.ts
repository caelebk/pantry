import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AlertComponent,
  BadgeComponent,
  CardComponent,
  ConfirmDialogService,
  EmptyStateComponent,
  FormFieldComponent,
  SearchInputComponent,
  SegmentedControlComponent,
  SegmentedOption,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

/**
 * Dev-only component gallery (`/design-system`).
 * Living documentation of every canonical primitive and its states.
 * Registered only in development builds — see app.routes.ts.
 */
@Component({
  selector: 'pantry-design-system',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    AlertComponent,
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
    FormFieldComponent,
    SearchInputComponent,
    SegmentedControlComponent,
    SkeletonComponent,
    SpinnerComponent,
    SelectModule,
    InputTextModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="max-w-5xl mx-auto space-y-10">
    <header>
      <h1 class="type-page-title text-surface-900 dark:text-white">Pantry Design System</h1>
    </header>

    <!-- Typography prototype uses the same roles as the live pages. -->
    <pantry-card>
      <div class="space-y-6" *transloco="let t; prefix: 'typographyPrototype'">
        <div class="space-y-2">
          <p class="type-meta text-surface-500 dark:text-surface-400">{{ t('eyebrow') }}</p>
          <h2 class="type-section-title text-surface-900 dark:text-white">{{ t('title') }}</h2>
          <p class="text-sm text-surface-600 dark:text-surface-300 max-w-xl">
            {{ t('description') }}
          </p>
        </div>
        <div class="grid gap-6 sm:grid-cols-2">
          <div class="space-y-4">
            <h3 class="type-section-title text-surface-900 dark:text-white">
              {{ t('sectionTitle') }}
            </h3>
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-1 min-w-0">
                <p class="type-label text-surface-900 dark:text-white">
                  {{ t('ingredientName') }}
                </p>
                <p class="type-meta text-surface-500 dark:text-surface-400">
                  {{ t('ingredientMeta') }}
                </p>
              </div>
              <pantry-badge variant="expiring">{{ t('status') }}</pantry-badge>
            </div>
            <div class="border-t border-surface-200 dark:border-surface-700 pt-4 space-y-1">
              <p class="type-label text-surface-600 dark:text-surface-300">
                {{ t('valueLabel') }}
              </p>
              <p class="type-value text-surface-900 dark:text-white">$28.50</p>
              <p class="type-meta text-surface-500 dark:text-surface-400">{{ t('valueHint') }}</p>
            </div>
          </div>
          <div class="space-y-4">
            <pantry-form-field
              [label]="t('fieldLabel')"
              forId="type-prototype-ingredient"
              [hint]="t('fieldHint')">
              <input
                pInputText
                #fieldControl
                id="type-prototype-ingredient"
                [value]="t('ingredientName')"
                class="w-full" />
            </pantry-form-field>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-primary" disabled>{{ t('primaryAction') }}</button>
              <button type="button" class="btn-secondary" disabled>
                {{ t('secondaryAction') }}
              </button>
            </div>
            <p class="type-meta text-surface-500 dark:text-surface-400">{{ t('sampleHint') }}</p>
          </div>
        </div>
      </div>
    </pantry-card>

    <!-- Buttons -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Buttons</h2>
      <div class="flex flex-wrap items-center gap-3">
        <button class="btn-primary" type="button">Primary</button>
        <button class="btn-secondary" type="button">Secondary</button>
        <button class="btn-danger" type="button">Danger</button>
        <button class="btn-ghost" type="button">Ghost</button>
        <button class="btn-primary" type="button" disabled>Disabled</button>
        <button class="btn-icon" type="button" aria-label="Settings icon button">
          <i class="pi pi-cog"></i>
        </button>
        <button class="btn-icon-sm" type="button" aria-label="Edit row">
          <i class="pi pi-pencil text-xs"></i>
        </button>
        <button class="btn-primary" type="button">
          <pantry-spinner [announce]="false" size="xs" color="white" /> Saving
        </button>
      </div>
    </pantry-card>

    <!-- Badges -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Badges</h2>
      <div class="flex flex-wrap items-center gap-2">
        <pantry-badge variant="fresh">Fresh</pantry-badge>
        <pantry-badge variant="expiring" [dot]="true">Expiring</pantry-badge>
        <pantry-badge variant="expired">Expired</pantry-badge>
        <pantry-badge variant="primary">Primary</pantry-badge>
        <pantry-badge variant="neutral">Neutral</pantry-badge>
        <pantry-badge variant="location">Location</pantry-badge>
        <pantry-badge variant="outline">Outline</pantry-badge>
        <pantry-badge variant="fresh" size="sm">Fresh / sm</pantry-badge>
        <pantry-badge variant="fresh" [dot]="true" [live]="true">Live stock</pantry-badge>
      </div>
    </pantry-card>

    <!-- Form field -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Form Field</h2>
      <div class="grid gap-6 sm:grid-cols-2 max-w-2xl">
        <pantry-form-field label="Ingredient name" forId="ds-name" [required]="true">
          <input pInputText id="ds-name" placeholder="e.g. Roma Tomato" class="w-full" />
        </pantry-form-field>
        <pantry-form-field
          label="Quantity"
          forId="ds-qty"
          hint="Whole numbers and fractions allowed">
          <input pInputText id="ds-qty" class="w-full" />
        </pantry-form-field>
        <pantry-form-field
          label="Storage location"
          forId="ds-loc"
          [required]="true"
          [error]="'Location is required'">
          <input pInputText #fieldControl id="ds-loc" class="w-full" />
        </pantry-form-field>
        <pantry-form-field #f label="Unit" forId="ds-unit">
          <p-select
            appendTo="body"
            inputId="ds-unit"
            [ariaLabelledBy]="f.labelId()"
            styleClass="w-full"
            [options]="units"
            [ngModel]="selectedUnit()"
            (ngModelChange)="selectedUnit.set($event)" />
        </pantry-form-field>
      </div>
    </pantry-card>

    <!-- States -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">
        Loading &amp; Empty States
      </h2>
      <div class="flex flex-wrap items-center gap-6">
        <pantry-spinner [announce]="false" size="sm" />
        <pantry-spinner size="md" label="Loading..." />
        <pantry-spinner size="lg" color="surface" layout="stacked" label="Loading pantry..." />
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <pantry-skeleton variant="card" height="96px" />
        <pantry-skeleton variant="row" />
        <pantry-skeleton variant="text" />
      </div>
      <div class="mt-6">
        <pantry-empty-state
          icon="pi pi-inbox"
          title="No pantry items found"
          description="Try adding items or clearing your filters."
          actionText="Add item"
          actionIcon="pi pi-plus">
        </pantry-empty-state>
      </div>
    </pantry-card>

    <!-- Surfaces -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Card Surfaces</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <pantry-card variant="glass" padding="sm"><span>Glass</span></pantry-card>
        <pantry-card variant="sub" padding="sm" [hover]="true"> Sub (hover) </pantry-card>
        <pantry-card variant="elevated" padding="sm"><span>Elevated</span></pantry-card>
      </div>
      <div class="mt-4 max-w-md">
        <pantry-search-input placeholder="Search ingredients…" />
      </div>
    </pantry-card>
    <!-- Segmented control -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Segmented Control</h2>
      <pantry-segmented-control
        ariaLabel="Storage view"
        [options]="viewOptions"
        [(value)]="selectedView" />
      <p class="type-meta text-surface-500 dark:text-surface-400 mt-3">
        Selected: {{ selectedView() }}. Use the arrow keys to move.
      </p>
    </pantry-card>

    <!-- Alerts -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Alerts</h2>
      <div class="space-y-3 max-w-xl">
        <pantry-alert variant="info" title="Info"
          >Your pantry syncs every few minutes.</pantry-alert
        >
        <pantry-alert variant="success" title="Saved">Milk was added to the fridge.</pantry-alert>
        <pantry-alert variant="warning">Three items expire within two days.</pantry-alert>
        @if (!dangerDismissed()) {
          <pantry-alert
            variant="danger"
            title="Could not save"
            [dismissible]="true"
            dismissLabel="Dismiss error"
            (dismissed)="dangerDismissed.set(true)">
            Check your connection and try again.
          </pantry-alert>
        }
      </div>
    </pantry-card>

    <!-- Confirm dialog -->
    <pantry-card>
      <h2 class="type-section-title text-surface-900 dark:text-white mb-4">Confirm Dialog</h2>
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="btn-secondary" (click)="openConfirm(false)">Confirm</button>
        <button type="button" class="btn-danger" (click)="openConfirm(true)">
          Destructive confirm
        </button>
      </div>
      @if (confirmResult() !== null) {
        <p class="type-meta text-surface-500 dark:text-surface-400 mt-3">
          Last result: {{ confirmResult() ? 'accepted' : 'cancelled' }}
        </p>
      }
    </pantry-card>
  </div>`,
})
export class DesignSystemPageComponent {
  readonly units = ['g', 'kg', 'ml', 'l', 'pcs'];
  readonly selectedUnit = signal<string>('g');

  readonly viewOptions: SegmentedOption[] = [
    { value: 'all', label: 'All' },
    { value: 'fridge', label: 'Fridge', icon: 'pi pi-box' },
    { value: 'pantry', label: 'Pantry' },
  ];
  readonly selectedView = signal<string | undefined>('all');
  readonly dangerDismissed = signal(false);

  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly confirmResult = signal<boolean | null>(null);

  async openConfirm(destructive: boolean): Promise<void> {
    this.confirmResult.set(
      await this.confirmDialog.confirm({
        title: destructive ? 'Remove item?' : 'Save changes?',
        message: destructive ? 'This item will be removed from your pantry.' : 'Apply your edits.',
        acceptLabel: destructive ? 'Remove' : 'Save',
        destructive,
      }),
    );
  }
}
