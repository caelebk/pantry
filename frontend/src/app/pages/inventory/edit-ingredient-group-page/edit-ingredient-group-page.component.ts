import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NutrientGroup } from '@models/nutrient-type.model';
import { CategoryService } from '@services/inventory/category.service';
import { NutrientTypeService } from '@services/inventory/nutrient-type.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-edit-ingredient-group-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './edit-ingredient-group-page.component.html',
})
export class EditIngredientGroupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly nutrientTypeService = inject(NutrientTypeService);
  private readonly toastService = inject(ToastService);

  public groupId = signal<number | null>(null);
  public groupForm!: FormGroup;
  public nutrientGroups = signal<NutrientGroup[]>([]);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!id || isNaN(id)) {
      this.toastService.showError('Invalid group ID');
      this.router.navigate(['/inventory/groups']);
      return;
    }
    this.groupId.set(id);

    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nutrientGroup: [null],
    });

    this.nutrientTypeService.getNutrientGroups().subscribe({
      next: (groups) => this.nutrientGroups.set(groups),
    });

    this.categoryService.getIngredientGroupById(id).subscribe({
      next: (group) => {
        this.groupForm.patchValue({
          name: group.name,
          nutrientGroup: group.nutrientGroupId ? { id: group.nutrientGroupId, name: group.nutrientGroupName || '' } : null,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading ingredient group:', err);
        this.toastService.showError('Failed to load ingredient group details.');
        this.router.navigate(['/inventory/groups']);
      },
    });
  }

  onSubmit(): void {
    const id = this.groupId();
    if (!id) return;

    this.submitError.set(null);
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      this.submitError.set('Please fill in all required fields.');
      return;
    }

    const val = this.groupForm.value;
    this.isSubmitting.set(true);

    this.categoryService.updateIngredientGroup(id, {
      name: val.name,
      nutrientGroupId: val.nutrientGroup ? val.nutrientGroup.id : undefined,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.showSuccess(`Ingredient Group "${val.name}" updated successfully.`);
        this.router.navigate(['/inventory/groups']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.message || 'Failed to update ingredient group.';
        this.submitError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/groups']);
  }
}
