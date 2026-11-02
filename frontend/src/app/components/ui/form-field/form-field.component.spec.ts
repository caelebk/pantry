import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
  });

  it('should render label and required indicator', () => {
    expect(component).toBeTruthy();
    fixture.componentRef.setInput('label', 'Item Name');
    fixture.componentRef.setInput('forId', 'item-name');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');
    expect(label.getAttribute('for')).toBe('item-name');
    expect(label.textContent).toContain('Item Name');
    expect(label.textContent).toContain('*');
  });

  it('should render error message with role="alert"', () => {
    fixture.componentRef.setInput('error', 'Name is required');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Name is required');
  });
});

@Component({
  standalone: true,
  imports: [FormFieldComponent, FormsModule, SelectModule],
  template: `<pantry-form-field label="Name" forId="name" [hint]="hint()" [error]="error()">
      <input id="name" [(ngModel)]="value" aria-describedby="external" />
    </pantry-form-field>
    <pantry-form-field label="Unit" forId="unit" [hint]="hint()" [error]="error()">
      <p-select inputId="unit" [(ngModel)]="value" [options]="['grams']" />
    </pantry-form-field>`,
})
class FieldHost {
  value = '';
  hint = signal('Choose a value');
  error = signal('');
}

describe('projected field semantics', () => {
  it('associates help and errors with native and PrimeNG focus targets and removes stale associations', async () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input');
    const select = fixture.nativeElement.querySelector('[role="combobox"]');
    for (const control of [input, select]) {
      const ids = control.getAttribute('aria-describedby').split(' ');
      expect(
        ids.some((id: string) =>
          fixture.nativeElement
            .querySelector(`[id="${id}"]`)
            ?.textContent.includes('Choose a value'),
        ),
      ).toBe(true);
    }
    expect(input.getAttribute('aria-describedby')).toContain('external');
    input.setAttribute(
      'aria-describedby',
      input.getAttribute('aria-describedby') + ' external-later',
    );
    fixture.componentInstance.error.set('Value is required');
    fixture.detectChanges();
    await fixture.whenStable();
    for (const control of [input, select]) {
      expect(control.getAttribute('aria-invalid')).toBe('true');
      const ids = control.getAttribute('aria-describedby').split(' ');
      expect(
        ids.some((id: string) =>
          fixture.nativeElement
            .querySelector(`[id="${id}"]`)
            ?.textContent.includes('Value is required'),
        ),
      ).toBe(true);
      expect(ids.some((id: string) => id.endsWith('-hint'))).toBe(false);
    }
    fixture.componentInstance.error.set('');
    fixture.componentInstance.hint.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.getAttribute('aria-describedby')).toBe('external external-later');
    expect(select.getAttribute('aria-describedby')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(select.getAttribute('aria-invalid')).toBeNull();
  });
});
