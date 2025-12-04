import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators, FormControl, FormGroup } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, Category, Unit, Location } from '../../../../models/items.model';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';

interface AddItemFormControls {
  name: FormControl<string>;
  category: FormControl<Category>;
  quantity: FormControl<number>;
  unit: FormControl<Unit>;
  purchaseDate: FormControl<Date | null>;
  openedDate: FormControl<Date | null>;
  bestBeforeDate: FormControl<Date | null>;
  location: FormControl<Location>;
  notes: FormControl<string>;
}

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
    Textarea
  ],
  templateUrl: './add-item-form.component.html',
})
export class AddItemFormComponent {
  categories: Category[] = Object.values(Category);
  units: Unit[] = Object.values(Unit);
  locations: Location[] = Object.values(Location);

  addItemForm: FormGroup<AddItemFormControls> = new FormGroup({
    name: new FormControl<string>(
      '', 
      { nonNullable: true, validators: Validators.required }
    ),
    category: new FormControl<Category>(
      Category.Produce, 
      { nonNullable: true, validators: Validators.required }
    ),
    quantity: new FormControl<number>(
      1, 
      { nonNullable: true, validators: [Validators.required, Validators.min(1)] }
    ),
    unit: new FormControl<Unit>(
      Unit.Gram, 
      { nonNullable: true, validators: Validators.required }
    ),
    purchaseDate: new FormControl<Date | null>(
      new Date(), 
      { validators: Validators.required }
    ),
    openedDate: new FormControl<Date | null>(
      null,
    ),
    bestBeforeDate: new FormControl<Date | null>(
      null,
      { validators: Validators.required }
    ),
    location: new FormControl<Location>(
      Location.Shelf, 
      { nonNullable: true, validators: Validators.required }
    ),
    notes: new FormControl<string>(
      '', 
      { nonNullable: true }
    )
  });

  toItem(): Item | null {
    if (!this.addItemForm.valid) {
      return null;
    }

    const formValue = this.addItemForm.getRawValue();

    return {
      name: formValue.name!,
      category: formValue.category!,
      quantity: formValue.quantity!,
      unit: formValue.unit!,
      purchaseDate: formValue.purchaseDate!,
      openedDate: formValue.openedDate!,
      bestBeforeDate: formValue.bestBeforeDate!,
      location: formValue.location!,
      notes: formValue.notes!
    };
  }

  onSubmit() {
    if (this.addItemForm.valid) {
      const item: Item = this.toItem()!;
      console.log('Form Submitted:', item);
      // TODO: Send item to service/API
    } else {
      this.addItemForm.markAllAsTouched();
    }
  }
}
