import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { ConfirmDialogService } from '@ui';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { KitchenCreateDialogComponent } from '../../components/kitchen-create-dialog/kitchen-create-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ProfileComponent } from './profile.component';

describe('Profile kitchen actions', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({ config: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
    });
    vi.spyOn(TestBed.inject(AuthService), 'getActiveSessions').mockReturnValue(of([]));
    TestBed.inject(AuthService).userKitchens.set([
      { id: 'first', name: 'Shared kitchen', role: 'editor', isPrimary: false, memberCount: 2 },
      { id: 'second', name: 'Personal kitchen', role: 'owner', isPrimary: true, memberCount: 1 },
    ]);
  });
  it('uses the shared creation dialog from the accessible Profile trigger', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-create-kitchen]',
    );
    expect(button).not.toBeNull();
    button?.click();
    fixture.detectChanges();
    const dialog = fixture.debugElement.query(By.directive(KitchenCreateDialogComponent))
      .componentInstance as KitchenCreateDialogComponent;
    expect(dialog.visible()).toBe(true);
  });
  it('selects memberships with native buttons and keeps Manage a separate action', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '[data-select-kitchen]',
    );
    expect(buttons).toHaveLength(2);
    buttons[0].click();
    fixture.detectChanges();
    expect(TestBed.inject(AuthService).activeKitchen()?.id).toBe('first');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].querySelector('button')).toBeNull();
  });
  describe('Log Out Other Devices', () => {
    function setup(accept = true) {
      const fixture = TestBed.createComponent(ProfileComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const confirmSpy = vi
        .spyOn(TestBed.inject(ConfirmDialogService), 'confirm')
        .mockResolvedValue(accept);
      const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'showError');
      return { component, confirmSpy, errorSpy };
    }

    it('asks for a destructive confirmation and does not revoke until accepted', async () => {
      const { component, confirmSpy } = setup(false);
      const revoke = vi.spyOn(TestBed.inject(AuthService), 'revokeAllSessions');
      component.onRevokeAllSessions();
      await Promise.resolve();
      expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
      expect(revoke).not.toHaveBeenCalled();
    });

    it('does not reload sessions on success (auth is cleared)', async () => {
      const { component } = setup();
      const auth = TestBed.inject(AuthService);
      vi.spyOn(auth, 'revokeAllSessions').mockReturnValue(of(undefined));
      const load = vi.spyOn(component, 'loadSessions');
      component.onRevokeAllSessions();
      await Promise.resolve();
      expect(load).not.toHaveBeenCalled();
    });

    it('shows an error toast on failure', async () => {
      const { component, errorSpy } = setup();
      vi.spyOn(TestBed.inject(AuthService), 'revokeAllSessions').mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      component.onRevokeAllSessions();
      await Promise.resolve();
      await Promise.resolve();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
