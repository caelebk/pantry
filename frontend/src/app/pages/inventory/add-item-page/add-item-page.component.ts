import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { FormFieldComponent, SpinnerComponent } from '@ui';
import { ingredientDetailReturnTo } from '@utility/ingredient-detail-return';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { ItemEditorComponent } from '../inventory-components/item-editor/item-editor.component';

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-add-item-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    TranslocoModule,
    ItemEditorComponent,
    SpinnerComponent,
    FormFieldComponent,
  ],
  templateUrl: './add-item-page.component.html',
})
export class AddItemPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly itemService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private previousIngredientName: string | null = null;
  public quickCreateError = signal<string | null>(null);

  public addItemForm: FormGroup<ItemFormControls> = createItemForm();
  public ingredients = signal<Ingredient[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public units = signal<Unit[]>([]);
  public locations = signal<Location[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  // Quick Create Ingredient Dialog state
  public displayQuickCreateDialog = signal<boolean>(false);
  public newIngredientName = signal<string>('');
  public newIngredientGroup = signal<IngredientGroup | null>(null);
  public newIngredientDefaultUnit = signal<Unit | null>(null);
  public isCreatingIngredient = signal<boolean>(false);

  private get returnTo(): string | null {
    return ingredientDetailReturnTo(this.route.snapshot.queryParams?.['returnTo']);
  }

  ngOnInit(): void {
    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.unitService.getUnits().subscribe({
      next: (units) => {
        this.units.set(units);
        if (units.length > 0 && !this.addItemForm.controls.unit.value) {
          this.addItemForm.controls.unit.setValue(units[0]);
        }
      },
    });

    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        if (locations.length > 0 && !this.addItemForm.controls.location.value) {
          this.addItemForm.controls.location.setValue(locations[0]);
        }
      },
    });

    // Auto fill Item Name & Unit when selecting an Ingredient
    this.addItemForm.controls.ingredient.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedIng) => {
        if (selectedIng) {
          const name = this.addItemForm.controls.name.value;
          if (!name || name === this.previousIngredientName) {
            this.addItemForm.controls.name.setValue(selectedIng.name);
          }
          if (selectedIng.defaultUnit) {
            this.addItemForm.controls.unit.setValue(selectedIng.defaultUnit);
            this.addItemForm.controls.unit.disable();
          } else {
            this.addItemForm.controls.unit.enable();
          }
        } else {
          this.addItemForm.controls.unit.enable();
        }
        this.previousIngredientName = selectedIng?.name ?? null;
      });

    this.loadIngredients();
  }

  loadIngredients(selectNewId?: string): void {
    this.ingredientService.getIngredients().subscribe({
      next: (ingredients) => {
        this.ingredients.set(ingredients);
        const targetId = selectNewId || this.route.snapshot.queryParams['ingredientId'];
        if (targetId) {
          const found = ingredients.find((i) => i.id === targetId);
          if (found) {
            this.addItemForm.controls.ingredient.setValue(found);
            if (!this.addItemForm.controls.name.value) {
              this.addItemForm.controls.name.setValue(found.name);
            }
            if (found.defaultUnit) {
              this.addItemForm.controls.unit.setValue(found.defaultUnit);
              this.addItemForm.controls.unit.disable();
            }
          }
        }
      },
    });
  }

  openQuickCreateIngredient(): void {
    if (this.isSubmitting()) return;
    this.quickCreateError.set(null);
    this.newIngredientName.set(this.addItemForm.controls.name.value || '');
    this.newIngredientGroup.set(null);
    this.newIngredientDefaultUnit.set(this.units()[0] || null);
    this.displayQuickCreateDialog.set(true);
  }

  submitQuickCreateIngredient(): void {
    if (this.isCreatingIngredient()) return;
    this.quickCreateError.set(null);
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
      next: (createdDto) => {
        this.isCreatingIngredient.set(false);
        this.displayQuickCreateDialog.set(false);
        this.toastService.showSuccess(`Ingredient "${name}" created!`, 'Ingredient Created');
        this.loadIngredients(createdDto.id);
      },
      error: (err) => {
        this.isCreatingIngredient.set(false);
        console.error('Failed to create ingredient:', err);
        this.quickCreateError.set(this.transloco.translate('itemEditor.createError'));
      },
    });
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;
    this.submitError.set(null);
    if (!this.addItemForm.valid) {
      this.addItemForm.markAllAsTouched();
      this.submitError.set(this.transloco.translate('itemEditor.requiredError'));
      return;
    }

    const newItem = toItem(this.addItemForm);
    if (!newItem) return;

    this.isSubmitting.set(true);
    this.itemService.addItem(newItem).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.showSuccess(
          `"${newItem.name}" has been added to inventory.`,
          'Item Added',
        );
        this.router.navigate([this.returnTo ?? '/inventory/items']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.message || 'Failed to add item to inventory. Please try again.';
        this.submitError.set(msg);
        this.toastService.showError(msg, 'Error');
      },
    });
  }

  onCancel(): void {
    if (this.isSubmitting()) return;
    this.router.navigate([this.returnTo ?? '/inventory/items']);
  }
}
