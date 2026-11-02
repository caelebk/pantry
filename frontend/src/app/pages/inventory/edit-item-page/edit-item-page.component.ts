import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ItemEditorComponent } from '../inventory-components/item-editor/item-editor.component';

@Component({
  selector: 'pantry-edit-item-page',
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
  templateUrl: './edit-item-page.component.html',
})
export class EditItemPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly itemService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly locationService = inject(LocationService);
  private readonly unitService = inject(UnitService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private previousIngredientName: string | null = null;
  public quickCreateError = signal<string | null>(null);

  public itemId = signal<string | null>(null);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  public ingredients = signal<Ingredient[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public units = signal<Unit[]>([]);
  public locations = signal<Location[]>([]);

  public editItemForm: FormGroup<ItemFormControls> = createItemForm();

  // Quick Create Ingredient Dialog state
  public displayQuickCreateDialog = signal<boolean>(false);
  public newIngredientName = signal<string>('');
  public newIngredientGroup = signal<IngredientGroup | null>(null);
  public newIngredientDefaultUnit = signal<Unit | null>(null);
  public isCreatingIngredient = signal<boolean>(false);

  private readonly destroyRef = inject(DestroyRef);

  private get returnTo(): string | null {
    return ingredientDetailReturnTo(this.route.snapshot.queryParams?.['returnTo']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.showError('Invalid item ID');
      this.router.navigate(['/inventory']);
      return;
    }

    this.itemId.set(id);

    this.ingredientGroupService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.unitService.getUnits().subscribe({
      next: (u) => this.units.set(u),
    });

    this.locationService.getLocations().subscribe({
      next: (l) => this.locations.set(l),
    });

    this.editItemForm.controls.ingredient.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedIng) => {
        if (selectedIng) {
          const name = this.editItemForm.controls.name.value;
          if (!name || name === this.previousIngredientName) {
            this.editItemForm.controls.name.setValue(selectedIng.name);
          }
          if (selectedIng.defaultUnit) {
            this.editItemForm.controls.unit.setValue(selectedIng.defaultUnit);
            this.editItemForm.controls.unit.disable();
          } else {
            this.editItemForm.controls.unit.enable();
          }
        } else {
          this.editItemForm.controls.unit.enable();
        }
        this.previousIngredientName = selectedIng?.name ?? null;
      });

    this.loadIngredients(id);
  }

  loadIngredients(itemId?: string, selectNewId?: string): void {
    this.ingredientService.getIngredients().subscribe({
      next: (ings) => {
        this.ingredients.set(ings);

        if (selectNewId) {
          const found = ings.find((i) => i.id === selectNewId);
          if (found) {
            this.editItemForm.controls.ingredient.setValue(found);
            if (found.defaultUnit) {
              this.editItemForm.controls.unit.setValue(found.defaultUnit);
              this.editItemForm.controls.unit.disable();
            }
          }
        } else if (itemId && this.isLoading()) {
          this.itemService.getItemById(itemId).subscribe({
            next: (item) => {
              const matchedIngredient = ings.find((ing) => ing.id === item.ingredientId) || null;

              this.editItemForm.patchValue({
                name: item.name,
                ingredient: matchedIngredient,
                quantity: item.quantity,
                unit: matchedIngredient?.defaultUnit || item.unit,
                purchaseDate: item.purchaseDate,
                openedDate: item.openedDate,
                expirationDate: item.expirationDate,
                location: item.location,
                notes: item.notes,
              });

              if (matchedIngredient?.defaultUnit) {
                this.editItemForm.controls.unit.disable();
              }

              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('Failed to load item:', err);
              this.toastService.showError('Unable to load item details.');
              this.router.navigate(['/inventory']);
            },
          });
        }
      },
    });
  }

  openQuickCreateIngredient(): void {
    if (this.isSubmitting()) return;
    this.quickCreateError.set(null);
    this.newIngredientName.set(this.editItemForm.controls.name.value || '');
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
        this.loadIngredients(undefined, createdDto.id);
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
    if (this.editItemForm.invalid) {
      this.editItemForm.markAllAsTouched();
      this.submitError.set(this.transloco.translate('itemEditor.requiredError'));
      return;
    }

    const item = toItem(this.editItemForm);
    if (!item || !this.itemId()) {
      this.submitError.set('Failed to construct item update.');
      return;
    }

    const updatedItem: Item = {
      ...item,
      id: this.itemId()!,
    };

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.itemService.updateItem(updatedItem).subscribe({
      next: () => {
        this.toastService.showSuccess(`"${updatedItem.name}" updated successfully!`);
        this.router.navigate([this.returnTo ?? '/inventory/items']);
      },
      error: (err) => {
        console.error('Error updating item:', err);
        this.isSubmitting.set(false);
        this.submitError.set(err.message || 'An error occurred while saving the item.');
      },
    });
  }

  onCancel(): void {
    if (this.isSubmitting()) return;
    this.router.navigate([this.returnTo ?? '/inventory/items']);
  }
}
