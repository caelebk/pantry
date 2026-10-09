import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ToastService } from '../../services/toast.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  it('announces failures assertively and successes politely without moving focus, and dismisses by keyboard button', async () => {
    await TestBed.configureTestingModule({
      imports: [
        ToastContainerComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { COMMON: { DISMISS_NOTIFICATION: 'Dismiss notification' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ToastContainerComponent);
    fixture.detectChanges();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const service = TestBed.inject(ToastService);
    service.show({ type: 'success', message: 'Saved', duration: 0 });
    service.showError('Failure '.repeat(30));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(trigger);
    const success = fixture.nativeElement.querySelector('[role="status"]');
    const error = fixture.nativeElement.querySelector('[role="alert"]');
    expect(success.getAttribute('aria-live')).toBe('polite');
    expect(error.getAttribute('aria-live')).toBe('assertive');
    expect(error.getAttribute('aria-atomic')).toBe('true');
    const dismiss = error.querySelector('button');
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss notification');
    dismiss.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    trigger.remove();
  });
});
