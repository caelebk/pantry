import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  });

  it('should render glass card by default', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    const el = fixture.nativeElement.firstElementChild;
    expect(el.classList.contains('glass-card')).toBe(true);
    expect(el.classList.contains('rounded-2xl')).toBe(true);
  });

  it('should apply sub-card styles when variant is sub', () => {
    fixture.componentRef.setInput('variant', 'sub');
    fixture.componentRef.setInput('hover', true);
    fixture.detectChanges();

    const el = fixture.nativeElement.firstElementChild;
    expect(el.classList.contains('sub-card')).toBe(true);
    expect(el.classList.contains('sub-card-hover')).toBe(true);
  });
});
