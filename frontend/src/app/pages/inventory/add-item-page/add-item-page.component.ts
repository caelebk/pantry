import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
import {
  getTimeDifferenceString,
  isExpired,
  isExpiringSoon,
} from '@utility/itemUtility/ItemUtility';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'pantry-add-item-page',
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
  templateUrl: './add-item-page.component.html',
})
export class AddItemPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly itemService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);

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

  ngOnInit(): void {
    this.loadIngredients();

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
    this.addItemForm.controls.ingredient.valueChanges.subscribe((selectedIng) => {
      if (selectedIng) {
        if (!this.addItemForm.controls.name.value) {
          this.addItemForm.controls.name.setValue(selectedIng.name);
        }
        if (selectedIng.defaultUnit) {
          this.addItemForm.controls.unit.setValue(selectedIng.defaultUnit);
          this.addItemForm.controls.unit.disable();
        }
      } else {
        this.addItemForm.controls.unit.enable();
      }
    });
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
    this.newIngredientName.set(this.addItemForm.controls.name.value || '');
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
        this.loadIngredients(createdDto.id);
      },
      error: (err) => {
        this.isCreatingIngredient.set(false);
        console.error('Failed to create ingredient:', err);
        this.toastService.showError('Failed to create ingredient.');
      },
    });
  }

  selectLocation(loc: Location): void {
    this.addItemForm.controls.location.setValue(loc);
  }

  get previewItem(): Item | null {
    const raw = this.addItemForm.getRawValue();
    if (!raw.name && !raw.location) return null;

    return {
      id: 'preview',
      ingredientId: raw.ingredient?.id || '',
      name: raw.name || 'Item Name',
      quantity: raw.quantity || 1,
      unit: raw.unit || {
        id: 1,
        name: 'Piece',
        shortName: 'pc',
        type: UnitType.Count,
        toBaseFactor: 1,
      },
      purchaseDate: raw.purchaseDate || new Date(),
      expirationDate: raw.expirationDate || new Date(Date.now() + 7 * 86400000),
      location: raw.location || { id: 1, name: 'Pantry' },
      notes: raw.notes || '',
    };
  }

  get previewIsExpired(): boolean {
    const item = this.previewItem;
    return item ? isExpired(item) : false;
  }

  get previewIsExpiringSoon(): boolean {
    const item = this.previewItem;
    return item ? isExpiringSoon(item) : false;
  }

  get previewRemainingText(): string {
    const item = this.previewItem;
    if (!item || !item.expirationDate) return '7 days remaining';
    return item.expirationDate
      ? getTimeDifferenceString(new Date(), item.expirationDate)
      : 'No Expiration';
  }

  setExpirationDaysOffset(days: number): void {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    this.addItemForm.controls.expirationDate.setValue(targetDate);
    this.addItemForm.controls.expirationDate.markAsTouched();
    this.addItemForm.controls.expirationDate.markAsDirty();
  }

  onSubmit(): void {
    this.submitError.set(null);
    if (!this.addItemForm.valid) {
      this.addItemForm.markAllAsTouched();
      this.submitError.set('Please fill in all required fields marked with *.');
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
        this.router.navigate(['/inventory/items']);
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
    this.router.navigate(['/inventory/items']);
  }
}
