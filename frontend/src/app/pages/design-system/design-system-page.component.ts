import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BadgeComponent,
  CardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  SearchInputComponent,
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
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
    FormFieldComponent,
    SearchInputComponent,
    SkeletonComponent,
    SpinnerComponent,
    SelectModule,
    InputTextModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="max-w-5xl mx-auto p-6 sm:p-10 space-y-10">
    <header>
      <h1 class="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">
        Pantry Design System
      </h1>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
        Canonical primitives &amp; contracts. Spec: docs/design-system.md · Audit:
        docs/design-system-audit.md
      </p>
    </header>

    <!-- Buttons -->
    <pantry-card>
      <h2
        class="text-sm font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider mb-4">
        Buttons
      </h2>
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
          <pantry-spinner size="xs" color="white" /> Saving
        </button>
      </div>
    </pantry-card>

    <!-- Badges -->
    <pantry-card>
      <h2
        class="text-sm font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider mb-4">
        Badges
      </h2>
      <div class="flex flex-wrap items-center gap-2">
        <pantry-badge variant="fresh">Fresh</pantry-badge>
        <pantry-badge variant="expiring" [dot]="true">Expiring</pantry-badge>
        <pantry-badge variant="expired">Expired</pantry-badge>
        <pantry-badge variant="primary">Primary</pantry-badge>
        <pantry-badge variant="neutral">Neutral</pantry-badge>
        <pantry-badge variant="location">Location</pantry-badge>
        <pantry-badge variant="outline">Outline</pantry-badge>
        <pantry-badge variant="indigo">Indigo</pantry-badge>
        <pantry-badge variant="purple">Purple</pantry-badge>
        <pantry-badge variant="fresh" size="sm">Fresh / sm</pantry-badge>
        <pantry-badge variant="fresh" [dot]="true" [live]="true">Live stock</pantry-badge>
      </div>
    </pantry-card>

    <!-- Form field -->
    <pantry-card>
      <h2
        class="text-sm font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider mb-4">
        Form Field
      </h2>
      <div class="grid gap-6 sm:grid-cols-2 max-w-2xl">
        <pantry-form-field label="Ingredient name" forId="ds-name" [required]="true">
          <input pInputText id="ds-name" placeholder="e.g. Roma Tomato" class="w-full" />
        </pantry-form-field>
        <pantry-form-field
          label="Quantity"
          forId="ds-qty"
          hint="Whole numbers and fractions allowed">
          <input id="ds-qty" class="w-full" />
        </pantry-form-field>
        <pantry-form-field
          label="Storage location"
          forId="ds-loc"
          [required]="true"
          [error]="'Location is required'">
          <input id="ds-loc" class="w-full" />
        </pantry-form-field>
        <pantry-form-field label="Unit" forId="ds-unit">
          <p-select
            appendTo="body"
            inputId="ds-unit"
            styleClass="w-full"
            [options]="units"
            [ngModel]="selectedUnit()"
            (ngModelChange)="selectedUnit.set($event)" />
        </pantry-form-field>
      </div>
    </pantry-card>

    <!-- States -->
    <pantry-card>
      <h2
        class="text-sm font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider mb-4">
        Loading &amp; Empty States
      </h2>
      <div class="flex flex-wrap items-center gap-6">
        <pantry-spinner size="sm" />
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
      <h2
        class="text-sm font-bold text-surface-600 dark:text-surface-300 uppercase tracking-wider mb-4">
        Card Surfaces
      </h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <pantry-card variant="glass" padding="sm"><span>Glass</span></pantry-card>
        <pantry-card variant="sub" padding="sm" [hover]="true"> Sub (hover) </pantry-card>
        <pantry-card variant="elevated" padding="sm"><span>Elevated</span></pantry-card>
      </div>
      <div class="mt-4 max-w-md">
        <pantry-search-input placeholder="Search ingredients…" />
      </div>
    </pantry-card>
  </div>`,
})
export class DesignSystemPageComponent {
  readonly units = ['g', 'kg', 'ml', 'l', 'pcs'];
  readonly selectedUnit = signal<string>('g');
}
