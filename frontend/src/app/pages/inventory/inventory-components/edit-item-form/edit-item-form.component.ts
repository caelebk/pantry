import { CommonModule } from '@angular/common';
import { Component, effect, Input, input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { Textarea } from 'primeng/textarea';
import { Subject } from 'rxjs';

import { Ingredient } from '@models/ingredient.model';
import { Select } from 'primeng/select';

@Component({
  selector: 'pantry-edit-item-form',
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
    PanelModule,
  ],
  templateUrl: './edit-item-form.component.html',
})
export class EditItemFormComponent {
  @Input()
  units: Unit[] = [];
  @Input()
  locations: Location[] = [];
  @Input()
  ingredients: Ingredient[] = [];

  itemToEdit = input.required<Item>();

  @Output()
  updateItem$ = new Subject<Item>();

  editItemForm: FormGroup<ItemFormControls> = createItemForm();

  constructor() {
    effect(() => {
      const item = this.itemToEdit();
      if (item) {
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
      }
    });

    this.editItemForm.controls.ingredient.valueChanges.subscribe((selectedIng) => {
      if (selectedIng) {
        if (!this.editItemForm.controls.name.value) {
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
    });
  }

  selectLocation(loc: Location): void {
    this.editItemForm.controls.location.setValue(loc);
  }

  onSubmit() {
    if (this.editItemForm.valid) {
      const formValue = toItem(this.editItemForm);
      if (formValue) {
        //re-add id to item
        const updatedItem = {
          ...formValue,
          id: this.itemToEdit().id,
        };
        this.updateItem$.next(updatedItem);
      }
    } else {
      this.editItemForm.markAllAsTouched();
    }
  }
}
