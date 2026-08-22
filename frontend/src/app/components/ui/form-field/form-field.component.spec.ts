import { ComponentFixture, TestBed } from '@angular/core/testing';
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
