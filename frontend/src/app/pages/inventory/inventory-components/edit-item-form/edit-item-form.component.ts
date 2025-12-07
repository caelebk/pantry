import { Component, input, Output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, Category, Unit, Location } from '../../../../models/items.model';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { PanelModule } from 'primeng/panel';
import { Subject } from 'rxjs';
import { createItemForm, ItemFormControls, toItem } from '../../../../utility/itemFormUtility';

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

  itemToEdit = input.required<Item>();
  @Output() updateItem$ = new Subject<Item>();
  
  categories: Category[] = Object.values(Category);
  units: Unit[] = Object.values(Unit);
  locations: Location[] = Object.values(Location);

  editItemForm: FormGroup<ItemFormControls> = createItemForm();

  constructor() {
    effect(() => {
      const item = this.itemToEdit();
      if (item) {
        this.editItemForm.patchValue({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          purchaseDate: item.purchaseDate,
          openedDate: item.openedDate,
          bestBeforeDate: item.bestBeforeDate,
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
