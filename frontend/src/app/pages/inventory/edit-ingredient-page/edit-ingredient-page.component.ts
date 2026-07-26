import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IngredientGroup } from '@models/category.model';
import { Unit } from '@models/unit.model';
import { CategoryService } from '@services/inventory/category.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-edit-ingredient-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, SelectModule],
  templateUrl: './edit-ingredient-page.component.html',
})
export class EditIngredientPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ingredientService = inject(IngredientService);
  private readonly categoryService = inject(CategoryService);
  private readonly unitService = inject(UnitService);
  private readonly toastService = inject(ToastService);

  public ingredientId = signal<string | null>(null);
  public ingredientForm!: FormGroup;
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public units = signal<Unit[]>([]);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.showError('Invalid ingredient ID');
      this.router.navigate(['/inventory/ingredients']);
      return;
    }
    this.ingredientId.set(id);

    this.ingredientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientGroup: [null],
      defaultUnit: [null],
    });

    this.categoryService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.unitService.getUnits().subscribe({
      next: (units) => this.units.set(units),
    });

    this.ingredientService.getIngredientById(id).subscribe({
      next: (ing) => {
        this.ingredientForm.patchValue({
          name: ing.name,
          ingredientGroup: ing.ingredientGroup || null,
          defaultUnit: ing.defaultUnit || null,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching ingredient:', err);
        this.toastService.showError('Failed to load ingredient details.');
        this.router.navigate(['/inventory/ingredients']);
      },
    });
  }

  onSubmit(): void {
    const id = this.ingredientId();
    if (!id) return;

    this.submitError.set(null);
    if (this.ingredientForm.invalid) {
      this.ingredientForm.markAllAsTouched();
      this.submitError.set('Please fill in all required fields.');
      return;
    }

    const val = this.ingredientForm.value;
    this.isSubmitting.set(true);

    this.ingredientService
      .updateIngredient(id, {
        name: val.name,
        ingredientGroupId: val.ingredientGroup ? val.ingredientGroup.id : undefined,
        defaultUnitId: val.defaultUnit ? val.defaultUnit.id : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(`Ingredient "${val.name}" updated successfully.`);
          this.router.navigate(['/inventory/ingredients']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.message || 'Failed to update ingredient.';
          this.submitError.set(msg);
          this.toastService.showError(msg);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/ingredients']);
  }
}
