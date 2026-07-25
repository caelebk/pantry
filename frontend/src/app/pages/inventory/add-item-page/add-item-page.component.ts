import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit, UnitType } from '@models/unit.model';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ItemService } from '@services/inventory/item.service';
import { ToastService } from '@services/toast.service';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { getTimeDifferenceString, isExpired, isExpiringSoon } from '@utility/itemUtility/ItemUtility';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'pantry-add-item-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
  ],
  templateUrl: './add-item-page.component.html',
})
export class AddItemPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly itemService = inject(ItemService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);

  public addItemForm: FormGroup<ItemFormControls> = createItemForm();
  public units = signal<Unit[]>([]);
  public locations = signal<Location[]>([]);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
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
  }

  selectLocation(loc: Location): void {
    this.addItemForm.controls.location.setValue(loc);
  }

  get previewItem(): Item | null {
    const raw = this.addItemForm.getRawValue();
    if (!raw.name && !raw.location) return null;

    return {
      id: 'preview',
      ingredientId: '',
      name: raw.name || 'Item Name',
      quantity: raw.quantity || 1,
      unit: raw.unit || { id: 1, name: 'Piece', shortName: 'pc', type: UnitType.Count, toBaseFactor: 1 },
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
    return getTimeDifferenceString(new Date(), item.expirationDate);
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
        this.toastService.showSuccess(`"${newItem.name}" has been added to inventory.`, 'Item Added');
        this.router.navigate(['/inventory']);
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
    this.router.navigate(['/inventory']);
  }
}
