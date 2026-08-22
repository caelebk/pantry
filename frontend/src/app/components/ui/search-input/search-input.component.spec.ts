import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render search icon and input field', () => {
    expect(component).toBeTruthy();
    const input = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
    expect(input.getAttribute('aria-label')).toBe('Search');
  });

  it('should emit searchChange on input', () => {
    const spy = vi.fn();
    component.searchChange.subscribe(spy);

    const input = fixture.nativeElement.querySelector('input');
    input.value = 'Apples';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.value()).toBe('Apples');
    expect(spy).toHaveBeenCalledWith('Apples');
  });

  it('should show clear button when value is present and clear on click', () => {
    fixture.componentRef.setInput('value', 'Banana');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('button');
    expect(clearBtn).toBeTruthy();

    const spy = vi.fn();
    component.searchChange.subscribe(spy);

    clearBtn.click();
    fixture.detectChanges();

    expect(component.value()).toBe('');
    expect(spy).toHaveBeenCalledWith('');
  });

  it('should clear on Escape key press', () => {
    fixture.componentRef.setInput('value', 'Milk');
    fixture.detectChanges();

    const spy = vi.fn();
    component.searchChange.subscribe(spy);

    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(component.value()).toBe('');
    expect(spy).toHaveBeenCalledWith('');
  });
});
