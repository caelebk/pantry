import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { CreateRecipeDTO } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { IngredientService } from '../../../../services/inventory/ingredient.service';
import { UnitService } from '../../../../services/inventory/unit.service';
import { RecipeService } from '../../../../services/recipe.service';

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

@Component({
  selector: 'pantry-add-recipe-form',
  standalone: true,
  imports: [CommonModule, TranslocoModule, FormsModule],
  templateUrl: './add-recipe-form.component.html',
})
export class AddRecipeFormComponent implements OnInit {
  @Output() recipeCreated = new EventEmitter<void>();

  private readonly recipeService = inject(RecipeService);
  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  availableIngredients: Ingredient[] = [];
  availableUnits: Unit[] = [];
  ingredientMap = new Map<string, Ingredient>();

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingRecipeId = id;
    }

    this.unitService.getUnits().subscribe({
      next: (u) => (this.availableUnits = u),
      error: (err) => console.error('Failed to load units', err),
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
      error: (err) => console.error('Failed to load ingredients', err),
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
        alert('Could not load recipe details.');
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
    return this.availableIngredients.filter((ing) =>
      ing.name.toLowerCase().includes(term)
    );
  }

  selectIngredient(row: FormIngredientRow, ing: Ingredient): void {
    row.ingredientId = ing.id;
    row.searchFilter = ing.name;
    row.dropdownOpen = false;
    if (ing.defaultUnit) {
      row.unitId = ing.defaultUnit.id;
    }
  }

  // --- Step Row Handlers ---
  addStepRow(): void {
    this.recipeSteps.push({ instructionText: '', timerSeconds: null });
  }

  removeStepRow(index: number): void {
    this.recipeSteps.splice(index, 1);
  }

  // --- Form Submission ---
  submitForm(): void {
    if (!this.name.trim()) {
      alert('Recipe name is required');
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

    const request$ = this.isEditMode && this.editingRecipeId
      ? this.recipeService.updateRecipe(this.editingRecipeId, dto)
      : this.recipeService.createRecipe(dto);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
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
        alert('Failed to save recipe. Please check inputs.');
      },
    });
  }
}
