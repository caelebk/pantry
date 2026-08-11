import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientCategory } from '@models/ingredient-category.model';
import { Ingredient } from '@models/ingredient.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface IngredientItemSelection {
  name: string;
  existingId?: string;
  isExisting: boolean;
  groupName?: string;
}

@Component({
  selector: 'pantry-add-ingredient-group-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputTextModule, SelectModule],
  templateUrl: './add-ingredient-group-page.component.html',
})
export class AddIngredientGroupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly ingredientCategoryService = inject(IngredientCategoryService);
  private readonly ingredientService = inject(IngredientService);
  private readonly toastService = inject(ToastService);

  public groupForm!: FormGroup;
  public ingredientCategories = signal<IngredientCategory[]>([]);
  public existingIngredients = signal<Ingredient[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  // Autocomplete and multi-ingredient selection state
  public newIngredientInput = signal<string>('');
  public initialIngredients = signal<IngredientItemSelection[]>([]);
  public isDropdownOpen = signal<boolean>(false);

  // Computed matching suggestions filtered by query
  public suggestions = computed<Ingredient[]>(() => {
    const query = this.newIngredientInput().toLowerCase().trim();
    if (!query) return [];
    const selectedNames = new Set(this.initialIngredients().map((item) => item.name.toLowerCase()));
    return this.existingIngredients().filter(
      (ing) => ing.name.toLowerCase().includes(query) && !selectedNames.has(ing.name.toLowerCase()),
    );
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      ingredientCategory: [null],
    });

    this.ingredientCategoryService.getIngredientCategories().subscribe({
      next: (categories) => this.ingredientCategories.set(categories),
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => this.existingIngredients.set(ingredients),
    });
  }

  public onInputChange(value: string): void {
    this.newIngredientInput.set(value);
    this.isDropdownOpen.set(value.trim().length > 0);
  }

  public selectSuggestion(ing: Ingredient): void {
    const item: IngredientItemSelection = {
      name: ing.name,
      existingId: ing.id,
      isExisting: true,
      groupName: ing.ingredientGroup?.name || ing.category?.name,
    };
    this.initialIngredients.update((current) => [...current, item]);
    this.newIngredientInput.set('');
    this.isDropdownOpen.set(false);
  }

  public addIngredient(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const name = this.newIngredientInput().trim();
    if (!name) return;

    if (this.initialIngredients().some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      this.toastService.showError(`"${name}" is already in the ingredients list.`);
      return;
    }

    // Check if typed name matches an existing ingredient
    const match = this.existingIngredients().find(
      (ing) => ing.name.toLowerCase() === name.toLowerCase(),
    );

    const item: IngredientItemSelection = match
      ? {
          name: match.name,
          existingId: match.id,
          isExisting: true,
          groupName: match.ingredientGroup?.name || match.category?.name,
        }
      : {
          name: name,
          isExisting: false,
        };

    this.initialIngredients.update((current) => [...current, item]);
    this.newIngredientInput.set('');
    this.isDropdownOpen.set(false);
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
    const ingredientsToAssign = this.initialIngredients();
    this.isSubmitting.set(true);

    const categoryObj = val.ingredientCategory;
    this.ingredientGroupService
      .createIngredientGroup({
        name: val.name,
        ingredientCategoryId: categoryObj ? categoryObj.id : undefined,
      })
      .pipe(
        switchMap((createdGroup) => {
          if (ingredientsToAssign.length === 0) {
            return of({ group: createdGroup, count: 0 });
          }
          const requests = ingredientsToAssign.map((item) => {
            if (item.isExisting && item.existingId) {
              return this.ingredientService.updateIngredient(item.existingId, {
                ingredientGroupId: createdGroup.id,
              });
            } else {
              return this.ingredientService.createIngredient({
                name: item.name,
                ingredientGroupId: createdGroup.id,
                defaultUnitId: (item as { defaultUnitId?: number }).defaultUnitId || 1,
              });
            }
          });
          return forkJoin(requests).pipe(
            map(() => ({ group: createdGroup, count: ingredientsToAssign.length })),
          );
        }),
      )
      .subscribe({
        next: ({ count }) => {
          this.isSubmitting.set(false);
          const ingMsg = count > 0 ? ` with ${count} ingredient(s)` : '';
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
