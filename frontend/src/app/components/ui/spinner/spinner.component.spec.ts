import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SpinnerComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default md size and primary color', () => {
    expect(component).toBeTruthy();
    expect(component.size()).toBe('md');
    expect(component.color()).toBe('primary');

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.classList.contains('h-5')).toBe(true);
    expect(svg.classList.contains('text-primary-600')).toBe(true);
  });

  it('should render label and screen-reader accessible text', () => {
    fixture.componentRef.setInput('label', 'Loading items...');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Loading items...');
    const srOnly = fixture.nativeElement.querySelector('.sr-only');
    expect(srOnly.textContent).toBe('Loading items...');
  });

  it('should apply custom size and color classes', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('color', 'white');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.classList.contains('h-8')).toBe(true);
    expect(svg.classList.contains('text-white')).toBe(true);
  });

  it('should announce loading state by default', () => {
    const wrapper = fixture.nativeElement.querySelector('[role="status"]');
    expect(wrapper).toBeTruthy();
    expect(wrapper.getAttribute('aria-live')).toBe('polite');
    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe(
      translations.common.loading,
    );
  });

  it('should drop live region and screen-reader text when announce is false', () => {
    fixture.componentRef.setInput('announce', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-live]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sr-only')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });
});
