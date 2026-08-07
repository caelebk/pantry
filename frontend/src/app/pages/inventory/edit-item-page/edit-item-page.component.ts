import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit, UnitType } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'pantry-edit-item-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    DialogModule,
    ButtonModule,
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

  public itemId = signal<string | null>(null);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  public ingredients = signal<Ingredient[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public units = signal<Unit[]>([]);
  public locations = signal<Location[]>([]);

  public editItemForm: FormGroup<ItemFormControls> = createItemForm();
  public currentFormValue = signal<Record<string, unknown>>({});

  // Quick Create Ingredient Dialog state
  public displayQuickCreateDialog = signal<boolean>(false);
  public newIngredientName = signal<string>('');
  public newIngredientGroup = signal<IngredientGroup | null>(null);
  public newIngredientDefaultUnit = signal<Unit | null>(null);
  public isCreatingIngredient = signal<boolean>(false);

  public previewItem = computed<Item | null>(() => {
    const val = this.currentFormValue() as Record<string, unknown>;
    const defaultUnit: Unit = {
      id: 1,
      name: 'piece',
      shortName: 'pc',
      type: UnitType.Count,
      toBaseFactor: 1,
    };
    if (!val || !val.name) {
      return {
        id: this.itemId() || 'preview',
        ingredientId: '',
        name: 'Preview Item',
        quantity: 1,
        unit: this.units()[0] || defaultUnit,
        location: this.locations()[0] || { id: 1, name: 'Pantry' },
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        openedDate: undefined,
        notes: '',
      } as Item;
    }

    return {
      id: this.itemId() || 'preview',
      ingredientId: val.ingredient?.id || val.ingredientId || '',
      name: val.name || 'Untitled Item',
      quantity: val.quantity ?? 1,
      unit: val.unit || this.units()[0] || defaultUnit,
      location: val.location || this.locations()[0] || { id: 1, name: 'Pantry' },
      purchaseDate: val.purchaseDate ? new Date(val.purchaseDate) : new Date(),
      expirationDate: val.expirationDate
        ? new Date(val.expirationDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      openedDate: val.openedDate ? new Date(val.openedDate) : undefined,
      notes: val.notes || '',
    } as Item;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.showError('Invalid item reference');
      this.router.navigate(['/inventory/items']);
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

    this.loadIngredients(id);

    this.editItemForm.controls.ingredient.valueChanges.subscribe((selectedIng) => {
      if (selectedIng) {
        if (!this.editItemForm.controls.name.value) {
          this.editItemForm.controls.name.setValue(selectedIng.name);
        }
        if (selectedIng.defaultUnit) {
          this.editItemForm.controls.unit.setValue(selectedIng.defaultUnit);
          this.editItemForm.controls.unit.disable();
        }
      } else {
        this.editItemForm.controls.unit.enable();
      }
    });

    this.editItemForm.valueChanges.subscribe((val) => {
      this.currentFormValue.set(val);
    });
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

              this.currentFormValue.set({
                ...this.editItemForm.value,
                ingredientId: item.ingredientId,
              });
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
    this.newIngredientName.set(this.editItemForm.controls.name.value || '');
    this.newIngredientGroup.set(null);
    this.newIngredientDefaultUnit.set(this.units()[0] || null);
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
      next: (createdDto) => {
        this.isCreatingIngredient.set(false);
        this.displayQuickCreateDialog.set(false);
        this.toastService.showSuccess(`Ingredient "${name}" created!`, 'Ingredient Created');
        this.loadIngredients(undefined, createdDto.id);
      },
      error: (err) => {
        this.isCreatingIngredient.set(false);
        console.error('Failed to create ingredient:', err);
        this.toastService.showError('Failed to create ingredient.');
      },
    });
  }

  selectLocation(loc: Location): void {
    this.editItemForm.controls.location.setValue(loc);
  }

  onSubmit(): void {
    if (this.editItemForm.invalid) {
      this.editItemForm.markAllAsTouched();
      this.submitError.set('Please check required form fields.');
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
        this.router.navigate(['/inventory/items']);
      },
      error: (err) => {
        console.error('Error updating item:', err);
        this.isSubmitting.set(false);
        this.submitError.set(err.message || 'An error occurred while saving the item.');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/items']);
  }
}
