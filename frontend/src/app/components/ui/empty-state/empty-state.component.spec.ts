import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should render title and description', () => {
    fixture.componentRef.setInput('title', 'No pantry items found');
    fixture.componentRef.setInput('description', 'Try adding items or clearing your filters.');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No pantry items found');
    expect(text).toContain('Try adding items or clearing your filters.');
  });

  it('should emit actionClick when action button is clicked', () => {
    fixture.componentRef.setInput('title', 'No recipes');
    fixture.componentRef.setInput('actionText', 'Create Recipe');
    fixture.detectChanges();

    const spy = vi.fn();
    component.actionClick.subscribe(spy);

    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Create Recipe');

    button.click();
    expect(spy).toHaveBeenCalled();
  });
});
