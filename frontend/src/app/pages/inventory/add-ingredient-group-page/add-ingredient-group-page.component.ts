import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-add-ingredient-group-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, SelectModule],
  templateUrl: './add-ingredient-group-page.component.html',
})
export class AddIngredientGroupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly toastService = inject(ToastService);

  public groupForm!: FormGroup;
  public ingredientCategories = signal<IngredientCategory[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientCategory: [null],
    });

    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (categories) => this.ingredientCategories.set(categories),
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

    const categoryObj = val.ingredientCategory;
    this.ingredientGroupService
      .createIngredientGroup({
        name: val.name,
        ingredientCategoryId: categoryObj ? categoryObj.id : undefined,
      })
      .subscribe({
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
