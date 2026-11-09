import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SegmentedControlComponent } from './segmented-control.component';

describe('SegmentedControlComponent', () => {
  let fixture: ComponentFixture<SegmentedControlComponent<string>>;

  const radios = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedControlComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SegmentedControlComponent<string>);
    fixture.componentRef.setInput('options', [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta', icon: 'pi pi-star' },
      { value: 'c', label: 'Gamma' },
    ]);
    fixture.componentRef.setInput('value', 'b');
    fixture.componentRef.setInput('ariaLabel', 'Greek');
    fixture.detectChanges();
  });

  it('should render a radiogroup with aria-checked and a roving tabindex', () => {
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeTruthy();
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('should make the first option the tab stop without a selection', () => {
    fixture.componentRef.setInput('value', undefined);
    fixture.detectChanges();
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('should keep targets at least 42px and style selection with primary', () => {
    expect(radios()[0].className).toContain('min-h-[42px]');
    expect(radios()[1].className).toContain('text-primary-800');
  });

  it('should select on click', () => {
    radios()[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('c');
  });

  it('should move selection and focus with arrow keys and wrap around', () => {
    radios()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('c');
    expect(document.activeElement).toBe(radios()[2]);

    radios()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('a');

    radios()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('c');
  });

  it('should not change value when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.componentInstance.select('a');
    expect(fixture.componentInstance.value()).toBe('b');
  });
});
