import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Unit } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { FormFieldComponent, SpinnerComponent } from '@ui';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-add-ingredient-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    FormFieldComponent,
    SpinnerComponent,
  ],
  templateUrl: './add-ingredient-page.component.html',
})
export class AddIngredientPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly toastService = inject(ToastService);

  public ingredientForm!: FormGroup;
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public units = signal<Unit[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.ingredientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientGroup: [null],
      defaultUnit: [null, [Validators.required]],
    });

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.unitService.getUnits().subscribe({
      next: (units) => this.units.set(units),
    });
  }

  onSubmit(): void {
    this.submitError.set(null);
    if (this.ingredientForm.invalid) {
      this.ingredientForm.markAllAsTouched();
      this.submitError.set('Please fill in all required fields.');
      return;
    }

    const val = this.ingredientForm.value;
    this.isSubmitting.set(true);

    this.ingredientService
      .createIngredient({
        name: val.name,
        ingredientGroupId: val.ingredientGroup ? val.ingredientGroup.id : undefined,
        defaultUnitId: val.defaultUnit ? val.defaultUnit.id : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.showSuccess(`Ingredient "${val.name}" added successfully.`);
          this.router.navigate(['/inventory/ingredients']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.message || 'Failed to create ingredient.';
          this.submitError.set(msg);
          this.toastService.showError(msg);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/ingredients']);
  }
}
