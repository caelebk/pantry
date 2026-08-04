import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { CreateRecipeDTO } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { IngredientGroupService } from '../../../../services/inventory/ingredient-group.service';
import { IngredientService } from '../../../../services/inventory/ingredient.service';
import { UnitService } from '../../../../services/inventory/unit.service';
import { RecipeService } from '../../../../services/recipe.service';
import { ToastService } from '../../../../services/toast.service';

interface FormIngredientRow {
  ingredientId: string;
  quantity: number;
  unitId: number | null;
  searchFilter: string;
  dropdownOpen: boolean;
}

interface FormStepRow {
  instructionText: string;
  timerSeconds?: number | null;
}

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'pantry-add-recipe-form',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DialogModule,
    ButtonModule,
  ],
  templateUrl: './add-recipe-form.component.html',
})
export class AddRecipeFormComponent implements OnInit {
  @Output() recipeCreated = new EventEmitter<void>();

  private readonly recipeService = inject(RecipeService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && !target.closest('.ingredient-search-container')) {
      this.recipeIngredients.forEach((row) => (row.dropdownOpen = false));
    }
  }

  onInputBlur(row: FormIngredientRow): void {
    setTimeout(() => {
      row.dropdownOpen = false;
    }, 200);
  }

  availableIngredients: Ingredient[] = [];
  availableUnits: Unit[] = [];
  ingredientMap = new Map<string, Ingredient>();

  // Quick Create Ingredient Dialog state
  displayQuickCreateDialog = signal<boolean>(false);
  newIngredientName = signal<string>('');
  newIngredientGroup = signal<IngredientGroup | null>(null);
  newIngredientDefaultUnit = signal<Unit | null>(null);
  isCreatingIngredient = signal<boolean>(false);
  ingredientGroups = signal<IngredientGroup[]>([]);
  activeRowIndexForQuickCreate: number | null = null;

  isEditMode = false;
  editingRecipeId: string | null = null;

  name = '';
  description = '';
  servings = 4;
  prepTime = 10;
  cookTime = 20;
  difficultyId = 1;

  tagInput = '';
  tags: string[] = [];

  recipeIngredients: FormIngredientRow[] = [];
  recipeSteps: FormStepRow[] = [{ instructionText: '', timerSeconds: null }];

  isSubmitting = false;
  validationErrors: string[] = [];
  serverErrorBanner: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingRecipeId = id;
    }

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.unitService.getUnits().subscribe({
      next: (u) => (this.availableUnits = u),
      error: (err) => {
        console.error('Failed to load units', err);
        this.toastService.showError('Unable to load units from server.', 'Network Error');
      },
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ing) => {
        this.availableIngredients = ing;
        ing.forEach((i) => this.ingredientMap.set(i.id, i));

        if (this.isEditMode && this.editingRecipeId) {
          this.loadRecipeForEditing(this.editingRecipeId);
        } else if (this.recipeIngredients.length === 0) {
          this.addIngredientRow();
        }
      },
      error: (err) => {
        console.error('Failed to load ingredients', err);
        this.toastService.showError('Unable to load ingredients from server.', 'Network Error');
      },
    });
  }

  private loadRecipeForEditing(id: string): void {
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.name = recipe.name;
        this.description = recipe.description || '';
        this.servings = recipe.servings || 4;
        this.prepTime = recipe.prepTime || 0;
        this.cookTime = recipe.cookTime || 0;
        this.difficultyId = recipe.difficultyId || 1;
        this.tags = recipe.tags ? [...recipe.tags] : [];

        if (recipe.ingredients && recipe.ingredients.length > 0) {
          this.recipeIngredients = recipe.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unitId: ing.unitId || null,
            searchFilter: this.ingredientMap.get(ing.ingredientId)?.name || '',
            dropdownOpen: false,
          }));
        } else {
          this.addIngredientRow();
        }

        if (recipe.steps && recipe.steps.length > 0) {
          this.recipeSteps = recipe.steps.map((st) => ({
            instructionText: st.instructionText,
            timerSeconds: st.timerSeconds || null,
          }));
        } else {
          this.recipeSteps = [{ instructionText: '', timerSeconds: null }];
        }
      },
      error: (err) => {
        console.error('Failed to load recipe for edit', err);
        this.toastService.showError('Could not load recipe details.', 'Not Found');
        this.router.navigate(['/recipes']);
      },
    });
  }

  get totalTime(): number {
    return (Number(this.prepTime) || 0) + (Number(this.cookTime) || 0);
  }

  goBack(): void {
    if (this.isEditMode && this.editingRecipeId) {
      this.router.navigate(['/recipes', this.editingRecipeId]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  // --- Tag Handlers ---
  addTag(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const cleanTag = this.tagInput.trim();
    if (cleanTag && !this.tags.includes(cleanTag)) {
      this.tags.push(cleanTag);
    }
    this.tagInput = '';
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  // --- Ingredient Row Handlers ---
  addIngredientRow(): void {
    this.recipeIngredients.push({
      ingredientId: '',
      quantity: 1,
      unitId: null,
      searchFilter: '',
      dropdownOpen: false,
    });
  }

  removeIngredientRow(index: number): void {
    this.recipeIngredients.splice(index, 1);
  }

  getFilteredIngredients(search: string): Ingredient[] {
    const term = search.toLowerCase().trim();
    if (!term) return this.availableIngredients;
    return this.availableIngredients.filter((ing) => ing.name.toLowerCase().includes(term));
  }

  getUnitShortName(unitId: number | null): string {
    if (!unitId) return '';
    const unit = this.availableUnits.find((u) => u.id === Number(unitId));
    return unit ? unit.shortName || unit.name : '';
  }

  selectIngredient(row: FormIngredientRow, ing: Ingredient): void {
    row.ingredientId = ing.id;
    row.searchFilter = ing.name;
    row.dropdownOpen = false;
    if (ing.defaultUnit) {
      row.unitId = ing.defaultUnit.id;
    }
  }

  // --- Quick Create Ingredient Handlers ---
  openQuickCreateIngredient(rowIndex?: number): void {
    this.activeRowIndexForQuickCreate = rowIndex !== undefined ? rowIndex : null;
    let initialName = '';
    if (rowIndex !== undefined && this.recipeIngredients[rowIndex]) {
      initialName = this.recipeIngredients[rowIndex].searchFilter.trim();
    }
    this.newIngredientName.set(initialName);
    this.newIngredientGroup.set(null);
    this.newIngredientDefaultUnit.set(this.availableUnits[0] || null);
    this.displayQuickCreateDialog.set(true);
  }

  submitQuickCreateIngredient(): void {
    const name = this.newIngredientName().trim();
    if (!name) {
      this.toastService.showError('Please enter an ingredient name.');
      return;
    }
    const defaultUnit = this.newIngredientDefaultUnit();
    if (!defaultUnit) {
      this.toastService.showError('Please select a default measurement unit.');
      return;
    }

    this.isCreatingIngredient.set(true);
    const dto = {
      name,
      ingredientGroupId: this.newIngredientGroup()?.id,
      defaultUnitId: defaultUnit.id,
    };

    this.ingredientService.createIngredient(dto).subscribe({
      next: (created) => {
        this.isCreatingIngredient.set(false);
        this.displayQuickCreateDialog.set(false);
        this.toastService.showSuccess(`Ingredient "${name}" created!`, 'Ingredient Created');

        this.ingredientService.getIngredients().subscribe({
          next: (ingredients) => {
            this.availableIngredients = ingredients;
            ingredients.forEach((i) => this.ingredientMap.set(i.id, i));

            if (
              this.activeRowIndexForQuickCreate !== null &&
              this.recipeIngredients[this.activeRowIndexForQuickCreate]
            ) {
              const row = this.recipeIngredients[this.activeRowIndexForQuickCreate];
              row.ingredientId = created.id;
              row.searchFilter = name;
              row.unitId = defaultUnit.id;
              row.dropdownOpen = false;
            }
          },
        });
      },
      error: (err) => {
        this.isCreatingIngredient.set(false);
        console.error('Failed to create ingredient:', err);
        this.toastService.showError('Failed to create ingredient.');
      },
    });
  }

  // --- Step Row Handlers ---
  addStepRow(): void {
    this.recipeSteps.push({ instructionText: '', timerSeconds: null });
  }

  removeStepRow(index: number): void {
    this.recipeSteps.splice(index, 1);
  }

  validateForm(): boolean {
    this.validationErrors = [];
    this.serverErrorBanner = null;

    if (!this.name.trim()) {
      this.validationErrors.push('Recipe name is required.');
    }

    if (Number(this.servings) <= 0) {
      this.validationErrors.push('Servings must be at least 1.');
    }

    if (Number(this.prepTime) < 0 || Number(this.cookTime) < 0) {
      this.validationErrors.push('Prep time and cook time cannot be negative.');
    }

    const validIngredients = this.recipeIngredients.filter((row) => row.ingredientId !== '');
    if (validIngredients.length === 0) {
      this.validationErrors.push('Please select at least one valid ingredient for the recipe.');
    }

    for (const row of this.recipeIngredients) {
      if (row.ingredientId && (Number(row.quantity) <= 0 || isNaN(Number(row.quantity)))) {
        this.validationErrors.push(
          `Ingredient "${row.searchFilter || 'item'}" must have a quantity greater than 0.`,
        );
      }
    }

    const validSteps = this.recipeSteps.filter((st) => st.instructionText.trim() !== '');
    if (validSteps.length === 0) {
      this.validationErrors.push('Please add at least one instruction step.');
    }

    if (this.validationErrors.length > 0) {
      this.toastService.showError('Please fix the highlighted form errors.', 'Validation Failed');
      return false;
    }

    return true;
  }

  // --- Form Submission ---
  submitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    const ingredientsPayload = this.recipeIngredients
      .filter((row) => row.ingredientId !== '')
      .map((row) => ({
        ingredientId: row.ingredientId,
        quantity: Number(row.quantity) || 1,
        unitId: row.unitId ? Number(row.unitId) : undefined,
      }));

    const stepsPayload = this.recipeSteps
      .filter((row) => row.instructionText.trim() !== '')
      .map((row, index) => ({
        stepNumber: index + 1,
        instructionText: row.instructionText.trim(),
        timerSeconds: row.timerSeconds ? Number(row.timerSeconds) : undefined,
      }));

    const dto: CreateRecipeDTO = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      servings: Number(this.servings) || 1,
      prepTime: Number(this.prepTime) || 0,
      cookTime: Number(this.cookTime) || 0,
      difficultyId: Number(this.difficultyId) || 1,
      ingredients: ingredientsPayload,
      steps: stepsPayload,
    };

    this.isSubmitting = true;

    const request$ =
      this.isEditMode && this.editingRecipeId
        ? this.recipeService.updateRecipe(this.editingRecipeId, dto)
        : this.recipeService.createRecipe(dto);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toastService.showSuccess(
          this.isEditMode
            ? `"${this.name}" updated successfully!`
            : `"${this.name}" created successfully!`,
          this.isEditMode ? 'Recipe Updated' : 'Recipe Created',
        );
        this.recipeCreated.emit();
        if (this.isEditMode) {
          this.router.navigate(['/recipes', res.id]);
        } else {
          this.router.navigate(['/recipes']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Failed to save recipe', err);
        const errMsg =
          err.error?.message || err.message || 'Server error occurred while saving the recipe.';
        this.serverErrorBanner = errMsg;
        this.toastService.showError(errMsg, 'Submission Failed');
      },
    });
  }
}
