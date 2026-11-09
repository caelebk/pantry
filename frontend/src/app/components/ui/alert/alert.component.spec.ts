import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AlertComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AlertComponent);
  });

  const box = (): HTMLElement => fixture.nativeElement.querySelector('div');

  it('should use role status for non-danger variants', () => {
    fixture.componentRef.setInput('variant', 'warning');
    fixture.detectChanges();
    expect(box().getAttribute('role')).toBe('status');
    expect(box().className).toContain('text-amber-700');
  });

  it('should use role alert and rose styling for danger', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    expect(box().getAttribute('role')).toBe('alert');
    expect(box().className).toContain('text-rose-700');
    expect(box().className).toContain('dark:text-rose-300');
  });

  it('should render the optional title', () => {
    fixture.componentRef.setInput('title', 'Heads up');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Heads up');
  });

  it('should omit the dismiss button by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('should emit dismissed from a labelled dismiss button', () => {
    fixture.componentRef.setInput('dismissible', true);
    fixture.componentRef.setInput('dismissLabel', 'Close message');
    fixture.detectChanges();
    let count = 0;
    fixture.componentInstance.dismissed.subscribe(() => count++);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Close message');
    button.click();
    expect(count).toBe(1);
  });

  it('should fall back to the translated dismiss label', () => {
    fixture.componentRef.setInput('dismissible', true);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe(translations.common.dismiss);
  });
});
