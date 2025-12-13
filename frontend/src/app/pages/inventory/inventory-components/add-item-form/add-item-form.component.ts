import { Component, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, Unit, Location } from '../../../../models/items.model';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { PanelModule } from 'primeng/panel';
import { Subject } from 'rxjs';
import { createItemForm, ItemFormControls, toItem } from '../../../../utility/ItemFormUtility';

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

  @Output() addItem$ = new Subject<Item>();
  
  units: Unit[] = Object.values(Unit);
  locations: Location[] = Object.values(Location);

  addItemForm: FormGroup<ItemFormControls> = createItemForm();

  onSubmit() {
    if (this.addItemForm.valid) {
      const item: Item | null = toItem(this.addItemForm);
      if (item) {
        this.addItem$.next(item);
        this.addItemForm.reset({
          name: '',
          quantity: 1,
          unit: Unit.Gram,
          purchaseDate: new Date(),
          openedDate: null,
          bestBeforeDate: null,
          location: Location.Shelf,
          notes: ''
        });
      }
    } else {
      this.addItemForm.markAllAsTouched();
    }
  }
}
