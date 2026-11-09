import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let events: Subject<unknown>;
  const options = { title: 'Remove', message: 'Sure?' };

  beforeEach(() => {
    events = new Subject<unknown>();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { events } }],
    });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('should resolve false and close the dialog on NavigationStart while pending', async () => {
    const close = vi.spyOn(service.confirmationService, 'close');
    const result = service.confirm(options);

    events.next(new NavigationStart(1, '/other'));

    expect(await result).toBe(false);
    expect(close).toHaveBeenCalled();
  });

  it('should not be affected by a navigation after the confirmation was accepted', async () => {
    const close = vi.spyOn(service.confirmationService, 'close');
    const accept = vi.fn();
    service.confirmationService.requireConfirmation$.subscribe((c) => {
      accept.mockImplementation(() => c.accept?.());
    });
    const result = service.confirm(options);
    accept();

    events.next(new NavigationStart(2, '/other'));

    expect(await result).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });
});
