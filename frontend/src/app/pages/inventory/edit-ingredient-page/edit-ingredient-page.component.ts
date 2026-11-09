import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Unit } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import {
  AlertComponent,
  CardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';
import { ingredientDetailReturnTo } from '@utility/ingredient-detail-return';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-edit-ingredient-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    FormFieldComponent,
    SpinnerComponent,
    AlertComponent,
    CardComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './edit-ingredient-page.component.html',
})
export class EditIngredientPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  public ingredientId = signal<string | null>(null);
  public originalDefaultUnitId = signal<number | null>(null);
  public ingredientForm!: FormGroup;
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public units = signal<Unit[]>([]);
  public isLoading = signal<boolean>(true);
  public loadFailed = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  private get returnTo(): string | null {
    return ingredientDetailReturnTo(this.route.snapshot.queryParams?.['returnTo']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.showError(this.transloco.translate('ingredientForm.invalidId'));
      this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
      return;
    }
    this.ingredientId.set(id);

    this.ingredientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientGroup: [null],
      defaultUnit: [null, [Validators.required]],
    });

    this.loadAll(id);
  }

  retryLoad(): void {
    const id = this.ingredientId();
    if (!id) return;
    this.loadFailed.set(false);
    this.isLoading.set(true);
    this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
      error: (err) => this.handleLoadError('ingredient groups', err),
    });

    this.unitService.getUnits().subscribe({
      next: (units) => this.units.set(units),
      error: (err) => this.handleLoadError('units', err),
    });

    this.loadIngredient(id);
  }

  private handleLoadError(what: string, err: unknown): void {
    console.error(`Error fetching ${what}:`, err);
    this.isLoading.set(false);
    this.loadFailed.set(true);
  }

  private loadIngredient(id: string): void {
    this.ingredientService.getIngredientById(id).subscribe({
      next: (ing) => {
        this.originalDefaultUnitId.set(ing.defaultUnit ? ing.defaultUnit.id : null);
        this.ingredientForm.patchValue({
          name: ing.name,
          ingredientGroup: ing.ingredientGroup || null,
          defaultUnit: ing.defaultUnit || null,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err?.status === 404) {
          this.toastService.showError(this.transloco.translate('ingredientForm.loadFailed'));
          this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
          return;
        }
        this.handleLoadError('ingredient', err);
      },
    });
  }

  onSubmit(): void {
    const id = this.ingredientId();
    if (!id) return;

    this.submitError.set(null);
    if (this.ingredientForm.invalid) {
      this.ingredientForm.markAllAsTouched();
      this.submitError.set(this.transloco.translate('ingredientForm.requiredFields'));
      return;
    }

    const val = this.ingredientForm.value;
    const newUnitId = val.defaultUnit ? val.defaultUnit.id : undefined;
    const origUnitId = this.originalDefaultUnitId();

    this.isSubmitting.set(true);

    if (newUnitId && origUnitId !== newUnitId) {
      this.ingredientService.getItemsByIngredientId(id).subscribe({
        next: (items) => {
          if (items && items.length > 0) {
            this.ingredientService
              .updateIngredient(id, {
                name: val.name,
                ingredientGroupId: val.ingredientGroup ? val.ingredientGroup.id : null,
              })
              .subscribe({
                next: () => {
                  this.isSubmitting.set(false);
                  this.toastService.showInfo(
                    this.transloco.translate('ingredientForm.unitChangedMessage'),
                    this.transloco.translate('ingredientForm.unitChangedTitle'),
                  );
                  this.router.navigate([`/inventory/ingredients/${id}/unit-reconciliation`], {
                    queryParams: {
                      targetUnitId: newUnitId,
                      ...(this.returnTo ? { returnTo: this.returnTo } : {}),
                    },
                  });
                },
                error: (err) => {
                  this.isSubmitting.set(false);
                  this.submitError.set(
                    err?.message || this.transloco.translate('ingredientForm.updateFailed'),
                  );
                },
              });
          } else {
            this.ingredientService
              .updateIngredient(id, {
                name: val.name,
                ingredientGroupId: val.ingredientGroup ? val.ingredientGroup.id : null,
                defaultUnitId: newUnitId,
              })
              .subscribe({
                next: () => {
                  this.isSubmitting.set(false);
                  this.toastService.showSuccess(
                    this.transloco.translate('ingredientForm.updated', { name: val.name }),
                  );
                  this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
                },
                error: (err) => {
                  this.isSubmitting.set(false);
                  this.submitError.set(
                    err?.message || this.transloco.translate('ingredientForm.updateFailed'),
                  );
                },
              });
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.submitError.set(
            err?.message || this.transloco.translate('ingredientForm.verifyFailed'),
          );
        },
      });
    } else {
      this.ingredientService
        .updateIngredient(id, {
          name: val.name,
          ingredientGroupId: val.ingredientGroup ? val.ingredientGroup.id : null,
          defaultUnitId: newUnitId,
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toastService.showSuccess(
              this.transloco.translate('ingredientForm.updated', { name: val.name }),
            );
            this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.submitError.set(
              err?.message || this.transloco.translate('ingredientForm.updateFailed'),
            );
          },
        });
    }
  }

  onCancel(): void {
    this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
  }
}
