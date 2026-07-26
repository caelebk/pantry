import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NutrientGroup } from '@models/nutrient-type.model';
import { CategoryService } from '@services/inventory/category.service';
import { NutrientTypeService } from '@services/inventory/nutrient-type.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-add-ingredient-group-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './add-ingredient-group-page.component.html',
})
export class AddIngredientGroupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly nutrientTypeService = inject(NutrientTypeService);
  private readonly toastService = inject(ToastService);

  public groupForm!: FormGroup;
  public nutrientGroups = signal<NutrientGroup[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nutrientGroup: [null],
    });

    this.nutrientTypeService.getNutrientGroups().subscribe({
      next: (groups) => this.nutrientGroups.set(groups),
    });
  }

  onSubmit(): void {
    this.submitError.set(null);
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.submitError.set('Please fill in all required fields.');
      return;
    }

    const val = this.groupForm.value;
    this.isSubmitting.set(true);

    this.categoryService.createIngredientGroup({
      name: val.name,
      nutrientGroupId: val.nutrientGroup ? val.nutrientGroup.id : undefined,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.showSuccess(`Ingredient Group "${val.name}" added successfully.`);
        this.router.navigate(['/inventory/groups']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.message || 'Failed to create ingredient group.';
        this.submitError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/groups']);
  }
}
