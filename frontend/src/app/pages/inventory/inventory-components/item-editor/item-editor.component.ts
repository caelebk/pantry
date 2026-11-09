import { Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { AlertComponent, CardComponent, FormFieldComponent, SpinnerComponent } from '@ui';
import { ItemFormControls } from '@utility/itemUtility/ItemFormUtility';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'pantry-item-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AlertComponent,
    CardComponent,
    FormFieldComponent,
    SpinnerComponent,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './item-editor.component.html',
})
export class ItemEditorComponent {
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly transloco = inject(TranslocoService);
  readonly form = input.required<FormGroup<ItemFormControls>>();
  readonly ingredients = input<Ingredient[]>([]);
  readonly locations = input<Location[]>([]);
  readonly units = input<Unit[]>([]);
  readonly submitting = input(false);
  readonly error = input<string | null>(null);
  readonly editing = input(false);
  readonly save = output<void>();
  readonly cancelEdit = output<void>();
  readonly createIngredient = output<void>();
  readonly detailsOpen = signal(false);

  fieldError(field: keyof ItemFormControls, key: string): string {
    const control = this.form().controls[field];
    return control.touched && control.invalid ? this.transloco.translate(`itemEditor.${key}`) : '';
  }

  setExpiry(days: number): void {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const control = this.form().controls.expirationDate;
    control.setValue(date);
    control.markAsDirty();
    control.markAsTouched();
  }

  onSubmit(): void {
    if (this.submitting()) return;
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      // Render validation errors before focusing the first invalid field.
      setTimeout(() => {
        const fields: (keyof ItemFormControls)[] = [
          'ingredient',
          'quantity',
          'unit',
          'location',
          'expirationDate',
          'name',
          'purchaseDate',
        ];
        const field = fields.find((name) => this.form().controls[name].invalid);
        if (field) this.element.nativeElement.querySelector<HTMLElement>(`#${field}`)?.focus();
      });
    }
    this.save.emit();
  }
}
