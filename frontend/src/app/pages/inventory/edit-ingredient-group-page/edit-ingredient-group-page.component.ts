import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { ToastService } from '@services/toast.service';
import {
  AlertComponent,
  CardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-edit-ingredient-group-page',
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
  templateUrl: './edit-ingredient-group-page.component.html',
})
export class EditIngredientGroupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  public groupId = signal<number | null>(null);
  public groupForm!: FormGroup;
  public ingredientCategories = signal<IngredientCategory[]>([]);
  public isLoading = signal<boolean>(true);
  public loadFailed = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!id || isNaN(id)) {
      this.toastService.showError(this.transloco.translate('groupForm.invalidId'));
      this.router.navigate(['/inventory/groups']);
      return;
    }
    this.groupId.set(id);

    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientCategory: [null],
    });

    this.loadAll(id);
  }

  retryLoad(): void {
    const id = this.groupId();
    if (!id) return;
    this.loadFailed.set(false);
    this.isLoading.set(true);
    this.loadAll(id);
  }

  private loadAll(id: number): void {
    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (categories) => this.ingredientCategories.set(categories),
      error: (err) => this.handleLoadError('ingredient categories', err),
    });

    this.loadGroup(id);
  }

  private handleLoadError(what: string, err: unknown): void {
    console.error(`Error loading ${what}:`, err);
    this.isLoading.set(false);
    this.loadFailed.set(true);
  }

  private loadGroup(id: number): void {
    this.ingredientGroupService.getIngredientGroupById(id).subscribe({
      next: (group) => {
        const catId = group.ingredientCategoryId;
        const catName = group.ingredientCategoryName ?? '';
        this.groupForm.patchValue({
          name: group.name,
          ingredientCategory: catId ? { id: catId, name: catName } : null,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err?.status === 404) {
          this.toastService.showError(this.transloco.translate('groupForm.loadFailed'));
          this.router.navigate(['/inventory/groups']);
          return;
        }
        this.handleLoadError('ingredient group', err);
      },
    });
  }

  onSubmit(): void {
    const id = this.groupId();
    if (!id) return;

    this.submitError.set(null);
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.submitError.set(this.transloco.translate('groupForm.requiredFields'));
      return;
    }

    const val = this.groupForm.value;
    this.isSubmitting.set(true);

    const categoryObj = val.ingredientCategory;
    this.ingredientGroupService
      .updateIngredientGroup(id, {
        name: val.name,
        ingredientCategoryId: categoryObj ? categoryObj.id : null,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(
            this.transloco.translate('groupForm.updated', { name: val.name }),
          );
          this.router.navigate(['/inventory/groups']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.message || this.transloco.translate('groupForm.updateFailed');
          this.submitError.set(msg);
          this.toastService.showError(msg);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/groups']);
  }
}
