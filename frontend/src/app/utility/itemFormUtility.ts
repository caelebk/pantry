import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Category, Item, Location, Unit } from "../models/items.model";

export interface ItemFormControls {
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

export function createItemForm(): FormGroup<ItemFormControls> {
  return new FormGroup<ItemFormControls>({
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
}

export function toItem(form: FormGroup<ItemFormControls>): Item | null {
  if (!form.valid) {
    return null;
  }

  const formValue = form.getRawValue();

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
