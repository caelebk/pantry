import { Component, input, Output, effect, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { PanelModule } from 'primeng/panel';
import { Subject } from 'rxjs';
import { createItemForm, ItemFormControls, toItem } from '@utility/itemUtility/ItemFormUtility';
import { Unit } from '@models/unit.model';
import { Location } from '@models/location.model';

@Component({
  selector: 'edit-item-form',
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
    PanelModule
  ],
  templateUrl: './edit-item-form.component.html',
})
export class EditItemFormComponent {
  @Input() units: Unit[] = [];
  @Input() locations: Location[] = [];

  itemToEdit = input.required<Item>();

  @Output() updateItem$ = new Subject<Item>();

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
          bestBeforeDate: item.expirationDate,
          location: item.location,
          notes: item.notes
        });
      }
    });
  }

  onSubmit() {
    if (this.editItemForm.valid) {
      const item: Item | null = toItem(this.editItemForm);
      if (item) {
        this.updateItem$.next(item);
      }
    } else {
      this.editItemForm.markAllAsTouched();
    }
  }
}
