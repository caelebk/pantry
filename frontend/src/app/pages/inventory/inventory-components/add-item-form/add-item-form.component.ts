import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { BadgeComponent, CardComponent, FormFieldComponent } from '@ui';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { Subject } from 'rxjs';

import { Ingredient } from '@models/ingredient.model';

@Component({
  selector: 'pantry-add-item-form',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    InputText,
    Select,
    InputNumber,
    DatePicker,
    Textarea,
    BadgeComponent,
    CardComponent,
    FormFieldComponent,
  ],
  templateUrl: './add-item-form.component.html',
})
export class AddItemFormComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly transloco = inject(TranslocoService);

  @Input()
  units: Unit[] = [];
  @Input()
  locations: Location[] = [];
  @Input()
  ingredients: Ingredient[] = [];

  @Output()
  addItem$ = new Subject<Item>();

  addItemForm: FormGroup<ItemFormControls> = createItemForm();
  detailsOpen = false;

  constructor() {
    this.addItemForm.controls.ingredient.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedIng) => {
        if (selectedIng) {
          if (!this.addItemForm.controls.name.value) {
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
      });
  }

  fieldError(field: keyof ItemFormControls, key: string): string {
    const control = this.addItemForm.controls[field];
    return control.touched && control.invalid ? this.transloco.translate(`itemEditor.${key}`) : '';
  }

  onSubmit() {
    if (this.addItemForm.valid) {
      const item: Item | null = toItem(this.addItemForm);
      if (item) {
        this.addItem$.next(item);
        this.addItemForm.reset({
          name: '',
          quantity: 1,
          purchaseDate: new Date(),
          openedDate: null,
          expirationDate: null,
          notes: '',
        });
      }
    } else {
      this.addItemForm.markAllAsTouched();
    }
  }

  setExpirationDaysOffset(days: number): void {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    this.addItemForm.controls.expirationDate.setValue(targetDate);
    this.addItemForm.controls.expirationDate.markAsTouched();
    this.addItemForm.controls.expirationDate.markAsDirty();
  }
}
