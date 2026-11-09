import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Injector,
  OnInit,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { CreateRecipeDTO } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import {
  AlertComponent,
  CardComponent,
  FormFieldComponent,
  SegmentedControlComponent,
  SegmentedOption,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';
import { IngredientGroupService } from '../../../../services/inventory/ingredient-group.service';
import { IngredientService } from '../../../../services/inventory/ingredient.service';
import { UnitService } from '../../../../services/inventory/unit.service';
import { RecipeService } from '../../../../services/recipe.service';
import { ToastService } from '../../../../services/toast.service';

interface FormIngredientRow {
  id: string;
  ingredientId: string;
  quantity: number;
  unitId: number | null;
}

interface FormStepRow {
  id: string;
  instructionText: string;
  timerSeconds?: number | null;
  textareaHeight?: number | null;
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
    FormFieldComponent,
    SkeletonComponent,
    AlertComponent,
    CardComponent,
    SegmentedControlComponent,
    SpinnerComponent,
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
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
  // Edit mode renders a skeleton until the recipe is patched, so create defaults never show
  // and the user cannot edit a form that is about to be overwritten.
  isLoadingRecipe = signal<boolean>(false);

  name = '';
  description = '';
  servings = 4;
  prepTime = 10;
  cookTime = 20;
  difficultyId = 1;

  readonly difficultyOptions: SegmentedOption<number>[] = [
    { value: 1, label: 'addRecipeForm.difficulties.easy' },
    { value: 2, label: 'addRecipeForm.difficulties.medium' },
    { value: 3, label: 'addRecipeForm.difficulties.hard' },
  ];

  localizedDifficultyOptions(): SegmentedOption<number>[] {
    return this.difficultyOptions.map((option) => ({
      ...option,
      label: this.transloco.translate(option.label),
    }));
  }

  recipeIngredients: FormIngredientRow[] = [];
  recipeSteps: FormStepRow[] = [
    { id: crypto.randomUUID(), instructionText: '', timerSeconds: null },
  ];

  isSubmitting = false;
  validationErrors: string[] = [];
  validationTargets: string[] = [];
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly validationSummary = viewChild<ElementRef<HTMLElement>>('validationSummary');

  fieldError(target: string): string | undefined {
    const index = this.validationTargets.indexOf(target);
    return index < 0 ? undefined : this.validationErrors[index];
  }

  focusValidationField(index: number): void {
    const target = this.validationTargets[index];
    const field = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[id]')).find(
      (element) => element.id === target,
    );
    field?.focus();
  }

  private addValidationError(message: string, target: string): void {
    this.validationErrors.push(message);
    this.validationTargets.push(target);
  }

  serverErrorBanner: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingRecipeId = id;
      this.isLoadingRecipe.set(true);
    }

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.unitService.getUnits().subscribe({
      next: (u) => (this.availableUnits = u),
      error: (err) => {
        console.error('Failed to load units', err);
        this.toastService.showError(
          this.transloco.translate('addRecipeForm.toast.unitsLoadError'),
          this.transloco.translate('addRecipeForm.toast.networkErrorTitle'),
        );
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
        this.toastService.showError(
          this.transloco.translate('addRecipeForm.toast.ingredientsLoadError'),
          this.transloco.translate('addRecipeForm.toast.networkErrorTitle'),
        );
        if (this.isEditMode) {
          // Without ingredients the edit form cannot show the recipe, so leave the endless skeleton.
          this.isLoadingRecipe.set(false);
          this.router.navigate(['/recipes']);
        }
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

        if (recipe.ingredients && recipe.ingredients.length > 0) {
          this.recipeIngredients = recipe.ingredients.map((ing) => ({
            id: crypto.randomUUID(),
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unitId: ing.unitId || null,
          }));
        } else {
          this.addIngredientRow();
        }

        if (recipe.steps && recipe.steps.length > 0) {
          this.recipeSteps = recipe.steps.map((st) => ({
            id: st.id || crypto.randomUUID(),
            instructionText: st.instructionText,
            timerSeconds: st.timerSeconds || null,
            textareaHeight:
              st.textareaHeight || (st as { textarea_height?: number }).textarea_height || null,
          }));
        } else {
          this.recipeSteps = [{ id: crypto.randomUUID(), instructionText: '', timerSeconds: null }];
        }
        this.isLoadingRecipe.set(false);
      },
      error: (err) => {
        console.error('Failed to load recipe for edit', err);
        this.toastService.showError(
          this.transloco.translate('addRecipeForm.toast.recipeLoadError'),
          this.transloco.translate('addRecipeForm.toast.notFoundTitle'),
        );
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

  // --- Ingredient Row Handlers ---
  addIngredientRow(): void {
    this.recipeIngredients.push({
      id: crypto.randomUUID(),
      ingredientId: '',
      quantity: 1,
      unitId: null,
    });
  }

  removeIngredientRow(index: number): void {
    this.recipeIngredients.splice(index, 1);
  }

  // --- Ingredient Drag & Drop ---
  draggedIngredientIndex: number | null = null;

  onIngredientDragStart(event: DragEvent, index: number): void {
    this.draggedIngredientIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
      const rowEl = (event.currentTarget as HTMLElement | null)?.closest?.(
        '.ingredient-row-card',
      ) as HTMLElement | null;
      if (rowEl) {
        event.dataTransfer.setDragImage(rowEl, 30, 20);
      }
    }
  }

  onIngredientDragOver(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.draggedIngredientIndex !== null && this.draggedIngredientIndex !== targetIndex) {
      const movedItem = this.recipeIngredients.splice(this.draggedIngredientIndex, 1)[0];
      this.recipeIngredients.splice(targetIndex, 0, movedItem);
      this.draggedIngredientIndex = targetIndex;
    }
  }

  onIngredientDrop(event: DragEvent): void {
    event.preventDefault();
    this.onIngredientDragEnd();
  }

  onIngredientDragEnd(): void {
    this.draggedIngredientIndex = null;
  }

  ingredientRowLabel(row: FormIngredientRow, index: number): string {
    return (
      this.getIngredientName(row.ingredientId) ||
      this.transloco.translate('addRecipeForm.ingredientRowFallback', { position: index + 1 })
    );
  }

  moveIngredientUp(index: number): void {
    this.moveIngredient(index, -1);
  }

  moveIngredientDown(index: number): void {
    this.moveIngredient(index, 1);
  }

  private moveIngredient(index: number, offset: -1 | 1): void {
    const moved = this.moveRow(this.recipeIngredients, index, offset);
    if (!moved) return;
    this.recipeIngredients = moved.rows;
    this.refocusMoveButton('ing', moved.rows[moved.index].id, offset);
  }

  /** Returns a reordered copy with the row at `index` swapped with its neighbour, or null at an edge. */
  private moveRow<T>(
    rows: T[],
    index: number,
    offset: -1 | 1,
  ): { rows: T[]; index: number } | null {
    const target = index + offset;
    if (index < 0 || index >= rows.length || target < 0 || target >= rows.length) return null;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    return { rows: next, index: target };
  }

  /** Keeps keyboard focus on the moved row's button, or its opposite when the row hit an edge. */
  private refocusMoveButton(kind: 'ing' | 'step', rowId: string, offset: -1 | 1): void {
    afterNextRender(
      () => {
        const direction = offset < 0 ? 'up' : 'down';
        const other = offset < 0 ? 'down' : 'up';
        const find = (dir: string) =>
          this.host.nativeElement.querySelector<HTMLButtonElement>(
            `[id="${kind}-move-${dir}-${rowId}"]`,
          );
        const same = find(direction);
        (same && !same.disabled ? same : find(other))?.focus();
      },
      { injector: this.injector },
    );
  }

  getUnitShortName(unitId: number | null): string {
    if (!unitId) return '';
    const unit = this.availableUnits.find((u) => u.id === Number(unitId));
    return unit ? unit.shortName || unit.name : '';
  }

  getIngredientName(ingredientId: string): string {
    return this.ingredientMap.get(ingredientId)?.name || '';
  }

  onIngredientChange(row: FormIngredientRow, ingredientId: string): void {
    const isLastRow = this.recipeIngredients[this.recipeIngredients.length - 1] === row;
    row.ingredientId = ingredientId;
    const ing = this.ingredientMap.get(ingredientId);
    if (ing?.defaultUnit) {
      row.unitId = ing.defaultUnit.id;
    }

    if (isLastRow && ingredientId !== '') {
      this.addIngredientRow();
    }
  }

  // --- Quick Create Ingredient Handlers ---
  openQuickCreateIngredient(rowIndex?: number): void {
    this.activeRowIndexForQuickCreate = rowIndex !== undefined ? rowIndex : null;
    let initialName = '';
    if (rowIndex !== undefined && this.recipeIngredients[rowIndex]) {
      initialName = this.getIngredientName(this.recipeIngredients[rowIndex].ingredientId);
    }
    this.newIngredientName.set(initialName);
    this.newIngredientGroup.set(null);
    this.newIngredientDefaultUnit.set(this.availableUnits[0] || null);
    this.displayQuickCreateDialog.set(true);
  }

  submitQuickCreateIngredient(): void {
    const name = this.newIngredientName().trim();
    if (!name) {
      this.toastService.showError(
        this.transloco.translate('addRecipeForm.toast.enterIngredientName'),
      );
      return;
    }
    const defaultUnit = this.newIngredientDefaultUnit();
    if (!defaultUnit) {
      this.toastService.showError(
        this.transloco.translate('addRecipeForm.toast.selectDefaultUnit'),
      );
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
        this.toastService.showSuccess(
          this.transloco.translate('addRecipeForm.toast.ingredientCreated', { name }),
          this.transloco.translate('addRecipeForm.toast.ingredientCreatedTitle'),
        );

        this.ingredientService.getIngredients().subscribe({
          next: (ingredients) => {
            this.availableIngredients = ingredients;
            ingredients.forEach((i) => this.ingredientMap.set(i.id, i));

            if (
              this.activeRowIndexForQuickCreate !== null &&
              this.recipeIngredients[this.activeRowIndexForQuickCreate]
            ) {
              const isLastRow =
                this.activeRowIndexForQuickCreate === this.recipeIngredients.length - 1;
              const row = this.recipeIngredients[this.activeRowIndexForQuickCreate];
              row.ingredientId = created.id;
              row.unitId = defaultUnit.id;

              if (isLastRow) {
                this.addIngredientRow();
              }
            }
          },
        });
      },
      error: (err) => {
        this.isCreatingIngredient.set(false);
        console.error('Failed to create ingredient:', err);
        this.toastService.showError(
          this.transloco.translate('addRecipeForm.toast.ingredientCreateFailed'),
        );
      },
    });
  }

  // --- Step Row Handlers ---
  addStepRow(): void {
    this.recipeSteps.push({ id: crypto.randomUUID(), instructionText: '', timerSeconds: null });
  }

  removeStepRow(index: number): void {
    this.recipeSteps.splice(index, 1);
  }

  // --- Step Drag & Drop ---
  draggedStepIndex: number | null = null;

  onStepDragStart(event: DragEvent, index: number): void {
    this.draggedStepIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
      const rowEl = (event.currentTarget as HTMLElement | null)?.closest?.(
        '.step-row-card',
      ) as HTMLElement | null;
      if (rowEl) {
        event.dataTransfer.setDragImage(rowEl, 30, 20);
      }
    }
  }

  onStepDragOver(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.draggedStepIndex !== null && this.draggedStepIndex !== targetIndex) {
      const movedItem = this.recipeSteps.splice(this.draggedStepIndex, 1)[0];
      this.recipeSteps.splice(targetIndex, 0, movedItem);
      this.draggedStepIndex = targetIndex;
    }
  }

  onStepDrop(event: DragEvent): void {
    event.preventDefault();
    this.onStepDragEnd();
  }

  onStepDragEnd(): void {
    this.draggedStepIndex = null;
  }

  onTextareaResize(event: Event, step: FormStepRow): void {
    const target = event.target as HTMLTextAreaElement;
    if (target && target.offsetHeight) {
      step.textareaHeight = target.offsetHeight;
    }
  }

  moveStepUp(index: number): void {
    this.moveStep(index, -1);
  }

  moveStepDown(index: number): void {
    this.moveStep(index, 1);
  }

  private moveStep(index: number, offset: -1 | 1): void {
    const moved = this.moveRow(this.recipeSteps, index, offset);
    if (!moved) return;
    this.recipeSteps = moved.rows;
    this.refocusMoveButton('step', moved.rows[moved.index].id, offset);
  }

  validateForm(): boolean {
    this.validationErrors = [];
    this.validationTargets = [];
    this.serverErrorBanner = null;

    if (!this.name.trim()) {
      this.addValidationError(
        this.transloco.translate('addRecipeForm.validation.nameRequired'),
        'recipe-name',
      );
    }

    if (Number(this.servings) <= 0) {
      this.addValidationError(
        this.transloco.translate('addRecipeForm.validation.servingsMin'),
        'recipe-servings',
      );
    }

    if (Number(this.prepTime) < 0 || Number(this.cookTime) < 0) {
      this.addValidationError(
        this.transloco.translate('addRecipeForm.validation.timesNegative'),
        Number(this.prepTime) < 0 ? 'recipe-prep-time' : 'recipe-cook-time',
      );
    }

    const validIngredients = this.recipeIngredients.filter((row) => row.ingredientId !== '');
    if (validIngredients.length === 0) {
      if (!this.recipeIngredients.length) this.addIngredientRow();
      this.addValidationError(
        this.transloco.translate('addRecipeForm.validation.ingredientRequired'),
        `ing-select-${this.recipeIngredients[0].id}`,
      );
    }

    for (const row of this.recipeIngredients) {
      if (row.ingredientId && (Number(row.quantity) <= 0 || isNaN(Number(row.quantity)))) {
        this.addValidationError(
          this.transloco.translate('addRecipeForm.validation.quantityRequired', {
            name:
              this.getIngredientName(row.ingredientId) ||
              this.transloco.translate('addRecipeForm.validation.ingredientFallbackName'),
          }),
          `ing-quantity-${row.id}`,
        );
      }
    }

    const validSteps = this.recipeSteps.filter((st) => st.instructionText.trim() !== '');
    if (validSteps.length === 0) {
      if (!this.recipeSteps.length) this.addStepRow();
      this.addValidationError(
        this.transloco.translate('addRecipeForm.validation.stepRequired'),
        `recipe-step-${this.recipeSteps[0].id}`,
      );
    }

    if (this.validationErrors.length > 0) {
      afterNextRender(() => this.validationSummary()?.nativeElement.focus(), {
        injector: this.injector,
      });
      return false;
    }

    return true;
  }

  // --- Form Submission ---
  submitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    // Capture live rendered heights directly from step textareas in DOM
    this.recipeSteps.forEach((step) => {
      const textareaEl = document.querySelector<HTMLTextAreaElement>(
        `textarea[name="step_${step.id}"]`,
      );
      if (textareaEl) {
        const currentHeight =
          textareaEl.offsetHeight || Math.round(textareaEl.getBoundingClientRect().height);
        if (currentHeight > 0) {
          step.textareaHeight = currentHeight;
        }
      }
    });

    const ingredientsPayload = this.recipeIngredients
      .filter((row) => row.ingredientId !== '')
      .map((row, index) => ({
        ingredientId: row.ingredientId,
        quantity: Number(row.quantity) || 1,
        unitId: row.unitId ? Number(row.unitId) : undefined,
        ingredientOrder: index + 1,
      }));

    const stepsPayload = this.recipeSteps
      .filter((row) => row.instructionText.trim() !== '')
      .map((row, index) => ({
        stepNumber: index + 1,
        instructionText: row.instructionText.trim(),
        timerSeconds: row.timerSeconds ? Number(row.timerSeconds) : undefined,
        textareaHeight: row.textareaHeight ? Number(row.textareaHeight) : undefined,
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
        const toastKey = this.isEditMode ? 'recipeUpdated' : 'recipeCreated';
        this.toastService.showSuccess(
          this.transloco.translate(`addRecipeForm.toast.${toastKey}`, { name: this.name }),
          this.transloco.translate(`addRecipeForm.toast.${toastKey}Title`),
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
          err.error?.message ||
          err.message ||
          this.transloco.translate('addRecipeForm.toast.saveFailed');
        this.serverErrorBanner = errMsg;
      },
    });
  }
}
