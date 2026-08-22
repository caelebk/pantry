import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render fresh status badge with emerald styling', () => {
    expect(component).toBeTruthy();
    fixture.componentRef.setInput('variant', 'fresh');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('text-emerald-600');
  });

  it('should render expiring badge with amber styling and dot', () => {
    fixture.componentRef.setInput('variant', 'expiring');
    fixture.componentRef.setInput('dot', true);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('text-amber-600');
    const dot = fixture.nativeElement.querySelector('.bg-amber-500');
    expect(dot).toBeTruthy();
  });

  it('should render indigo tone badge', () => {
    fixture.componentRef.setInput('variant', 'indigo');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('text-indigo-600');
  });

  it('should render purple tone badge', () => {
    fixture.componentRef.setInput('variant', 'purple');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('text-purple-600');
  });

  it('should render a pulsing dot when live is true', () => {
    fixture.componentRef.setInput('variant', 'fresh');
    fixture.componentRef.setInput('dot', true);
    fixture.componentRef.setInput('live', true);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.bg-emerald-500');
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('animate-pulse');
  });
});
