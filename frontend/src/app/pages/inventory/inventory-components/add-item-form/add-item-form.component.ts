import { Component, Input, Output } from '@angular/core';
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
  selector: 'add-item-form',
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
  templateUrl: './add-item-form.component.html',
})
export class AddItemFormComponent {
  @Input() units: Unit[] = [];
  @Input() locations: Location[] = [];

  @Output() addItem$ = new Subject<Item>();

  addItemForm: FormGroup<ItemFormControls> = createItemForm();

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
          bestBeforeDate: null,
          notes: ''
        });
      }
    } else {
      this.addItemForm.markAllAsTouched();
    }
  }
}
