import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let service: ConfirmDialogService;

  const button = (text: string): HTMLButtonElement | undefined =>
    Array.from(document.body.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === text,
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    service = TestBed.inject(ConfirmDialogService);
    fixture.detectChanges();
  });

  it('should show title, message and labels, and resolve true on accept', async () => {
    const result = service.confirm({
      title: 'Remove item',
      message: 'This cannot be undone.',
      acceptLabel: 'Remove',
      rejectLabel: 'Keep',
      destructive: true,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Remove item');
    expect(document.body.textContent).toContain('This cannot be undone.');
    expect(button('Remove')?.className).toContain('btn-danger');

    button('Remove')?.click();
    expect(await result).toBe(true);
  });

  it('should resolve false on cancel and focus Cancel first', async () => {
    const result = service.confirm({ title: 'Delete', message: 'Sure?', destructive: true });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(button('Cancel')).toBeTruthy();
    expect(button('Confirm')).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.activeElement).toBe(button('Cancel'));

    button('Cancel')?.click();
    expect(await result).toBe(false);
  });
});
