import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CardSurfaceDirective } from './card-surface.directive';

@Component({
  standalone: true,
  imports: [CardSurfaceDirective],
  template: `<article
    class="custom"
    pantryCard
    variant="sub"
    padding="none"
    [hover]="true"></article>`,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [CardSurfaceDirective],
  template: `<article pantryCard></article>`,
})
class DefaultHostComponent {}

describe('CardSurfaceDirective', () => {
  it('should apply the glass card classes by default', () => {
    const fixture = TestBed.createComponent(DefaultHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('article');
    expect(el.classList.contains('glass-card')).toBe(true);
    expect(el.classList.contains('rounded-2xl')).toBe(true);
    expect(el.classList.contains('p-5')).toBe(true);
  });

  it('should apply variant, padding and hover and keep existing classes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('article');
    expect(el.classList.contains('custom')).toBe(true);
    expect(el.classList.contains('sub-card')).toBe(true);
    expect(el.classList.contains('sub-card-hover')).toBe(true);
    expect(el.classList.contains('p-5')).toBe(false);
  });
});
