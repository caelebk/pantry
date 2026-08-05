import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add success toast', async () => {
    service.showSuccess('Operation completed', 'Success');

    const toasts = await firstValueFrom(service.getToasts());
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Operation completed');
  });

  it('should add and remove toast by id', async () => {
    service.showInfo('Notice item', 'Info');

    const toastsBefore = await firstValueFrom(service.getToasts());
    expect(toastsBefore.length).toBe(1);
    const toastId = toastsBefore[0].id;

    service.remove(toastId);

    const toastsAfter = await firstValueFrom(service.getToasts());
    expect(toastsAfter.length).toBe(0);
  });
});
