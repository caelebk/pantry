import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Item } from "@models/items.model";
import { Unit } from "@models/unit.model";
import { Location } from "@models/location.model";

export interface ItemFormControls {
  name: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<Unit | null>;
  purchaseDate: FormControl<Date | null>;
  openedDate: FormControl<Date | null>;
  bestBeforeDate: FormControl<Date | null>;
  location: FormControl<Location | null>;
  notes: FormControl<string>;
}

export function createItemForm(): FormGroup<ItemFormControls> {
  return new FormGroup<ItemFormControls>({
    name: new FormControl<string>(
      '',
      { nonNullable: true, validators: Validators.required }
    ),
    quantity: new FormControl<number>(
      1,
      { nonNullable: true, validators: [Validators.required, Validators.min(1)] }
    ),
    unit: new FormControl<Unit | null>(
      null,
      { validators: Validators.required }
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
    location: new FormControl<Location | null>(
      null,
      { validators: Validators.required }
    ),
    notes: new FormControl<string>(
      '',
      { nonNullable: true }
    )
  });
}

export function toItem(form: FormGroup<ItemFormControls>): Item | null {
  if (!form.valid) {
    return null;
  }

  const formValue = form.getRawValue();

  return {
    id: '0',
    ingredientId: '',
    name: formValue.name,
    quantity: formValue.quantity,
    unit: formValue.unit!,
    purchaseDate: formValue.purchaseDate!,
    openedDate: formValue.openedDate || undefined,
    expirationDate: formValue.bestBeforeDate!,
    location: formValue.location!,
    notes: formValue.notes
  };
}
