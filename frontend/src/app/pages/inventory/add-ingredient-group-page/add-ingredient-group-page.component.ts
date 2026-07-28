import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'pantry-add-ingredient-group-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputTextModule, SelectModule],
  templateUrl: './add-ingredient-group-page.component.html',
})
export class AddIngredientGroupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly ingredientService = inject(IngredientService);
  private readonly toastService = inject(ToastService);

  public groupForm!: FormGroup;
  public ingredientCategories = signal<IngredientCategory[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  // New multi-ingredient input state
  public newIngredientInput = signal<string>('');
  public initialIngredients = signal<string[]>([]);

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientCategory: [null],
    });

    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (categories) => this.ingredientCategories.set(categories),
    });
  }

  public addIngredient(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const name = this.newIngredientInput().trim();
    if (!name) return;

    if (this.initialIngredients().some((i) => i.toLowerCase() === name.toLowerCase())) {
      this.toastService.showError(`"${name}" is already in the ingredients list.`);
      return;
    }

    this.initialIngredients.update((current) => [...current, name]);
    this.newIngredientInput.set('');
  }

  public removeIngredient(index: number): void {
    this.initialIngredients.update((current) => current.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    this.submitError.set(null);
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.submitError.set('Please fill in all required fields.');
      return;
    }

    const val = this.groupForm.value;
    const ingredientsToCreate = this.initialIngredients();
    this.isSubmitting.set(true);

    const categoryObj = val.ingredientCategory;
    this.ingredientGroupService
      .createIngredientGroup({
        name: val.name,
        ingredientCategoryId: categoryObj ? categoryObj.id : undefined,
      })
      .pipe(
        switchMap((createdGroup) => {
          if (ingredientsToCreate.length === 0) {
            return of({ group: createdGroup, ingredientsCount: 0 });
          }
          const requests = ingredientsToCreate.map((ingName) =>
            this.ingredientService.createIngredient({
              name: ingName,
              ingredientGroupId: createdGroup.id,
            }),
          );
          return forkJoin(requests).pipe(
            map(() => ({ group: createdGroup, ingredientsCount: ingredientsToCreate.length })),
          );
        }),
      )
      .subscribe({
        next: ({ ingredientsCount }) => {
          this.isSubmitting.set(false);
          const ingMsg = ingredientsCount > 0 ? ` with ${ingredientsCount} ingredient(s)` : '';
          this.toastService.showSuccess(
            `Ingredient Group "${val.name}" added successfully${ingMsg}.`,
          );
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
