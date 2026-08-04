import { CommonModule } from '@angular/common';
import { Component, Input, Output } from '@angular/core';
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
    PanelModule,
  ],
  templateUrl: './add-item-form.component.html',
})
export class AddItemFormComponent {
  @Input()
  units: Unit[] = [];
  @Input()
  locations: Location[] = [];
  @Input()
  ingredients: Ingredient[] = [];

  @Output()
  addItem$ = new Subject<Item>();

  addItemForm: FormGroup<ItemFormControls> = createItemForm();

  constructor() {
    this.addItemForm.controls.ingredient.valueChanges.subscribe((selectedIng) => {
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
}
