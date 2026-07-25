import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'pantry-edit-item-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
  ],
  templateUrl: './edit-item-page.component.html',
})
export class EditItemPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly itemService = inject(ItemService);
  private readonly locationService = inject(LocationService);
  private readonly unitService = inject(UnitService);
  private readonly toastService = inject(ToastService);

  public itemId = signal<string | null>(null);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  public units = signal<Unit[]>([]);
  public locations = signal<Location[]>([]);

  public editItemForm: FormGroup<ItemFormControls> = createItemForm();
  public currentFormValue = signal<any>({});

  public previewItem = computed<Item | null>(() => {
    const val = this.currentFormValue();
    if (!val || !val.name) {
      return {
        id: this.itemId() || 'preview',
        ingredientId: '',
        name: 'Item Preview',
        quantity: 1,
        unit: this.units()[0] || { id: '1', name: 'piece', shortName: 'pc' },
        location: this.locations()[0] || { id: '1', name: 'Pantry' },
        purchaseDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        openedDate: undefined,
        notes: '',
      };
    }

    return {
      id: this.itemId() || 'preview',
      ingredientId: val.ingredientId || '',
      name: val.name || 'Untitled Item',
      quantity: val.quantity ?? 1,
      unit: val.unit || this.units()[0] || { id: '1', name: 'piece', shortName: 'pc' },
      location: val.location || this.locations()[0] || { id: '1', name: 'Pantry' },
      purchaseDate: val.purchaseDate ? new Date(val.purchaseDate) : new Date(),
      expirationDate: val.expirationDate ? new Date(val.expirationDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      openedDate: val.openedDate ? new Date(val.openedDate) : undefined,
      notes: val.notes || '',
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastService.showError('Invalid item reference');
      this.router.navigate(['/inventory']);
      return;
    }

    this.itemId.set(id);

    // Fetch dependencies & item data
    this.unitService.getUnits().subscribe({
      next: (u) => this.units.set(u),
    });

    this.locationService.getLocations().subscribe({
      next: (l) => this.locations.set(l),
    });

    this.itemService.getItemById(id).subscribe({
      next: (item) => {
        this.editItemForm.patchValue({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          purchaseDate: item.purchaseDate,
          openedDate: item.openedDate,
          expirationDate: item.expirationDate,
          location: item.location,
          notes: item.notes,
        });

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

    this.editItemForm.valueChanges.subscribe((val) => {
      this.currentFormValue.set(val);
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
        this.router.navigate(['/inventory']);
      },
      error: (err) => {
        console.error('Error updating item:', err);
        this.isSubmitting.set(false);
        this.submitError.set(err.message || 'An error occurred while saving the item.');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory']);
  }
}
