import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

  availableIngredients: Ingredient[] = [];
  availableUnits: Unit[] = [];

  name = '';
  description = '';
  servings = 4;
  prepTime = 10;
  cookTime = 20;
  difficultyId = 1;

  tagInput = '';
  tags: string[] = [];

  recipeIngredients: FormIngredientRow[] = [];
  recipeSteps: FormStepRow[] = [{ instructionText: '' }];

  isSubmitting = false;

  ngOnInit(): void {
    this.ingredientService.getIngredients().subscribe({
      next: (ing) => (this.availableIngredients = ing),
      error: (err) => console.error('Failed to load ingredients', err),
    });

    this.unitService.getUnits().subscribe({
      next: (u) => (this.availableUnits = u),
      error: (err) => console.error('Failed to load units', err),
    });

    // Add initial ingredient row
    this.addIngredientRow();
  }

  // --- Tag Input Handlers ---
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
    this.recipeSteps.push({ instructionText: '' });
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
    this.recipeService.createRecipe(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resetForm();
        this.recipeCreated.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Failed to create recipe', err);
        alert('Failed to create recipe. Please check inputs.');
      },
    });
  }

  private resetForm(): void {
    this.name = '';
    this.description = '';
    this.servings = 4;
    this.prepTime = 10;
    this.cookTime = 20;
    this.difficultyId = 1;
    this.tagInput = '';
    this.tags = [];
    this.recipeIngredients = [];
    this.addIngredientRow();
    this.recipeSteps = [{ instructionText: '' }];
  }
}
