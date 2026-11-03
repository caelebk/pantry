import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { KitchenCreateDialogComponent } from '../../components/kitchen-create-dialog/kitchen-create-dialog.component';
import { AuthService } from '../../core/services/auth.service';
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
    function setup() {
      const fixture = TestBed.createComponent(ProfileComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const confirmation = fixture.debugElement.injector.get(ConfirmationService);
      const messages = fixture.debugElement.injector.get(MessageService);
      const confirmSpy = vi
        .spyOn(confirmation, 'confirm')
        .mockImplementation((c) => (c.accept?.(), confirmation));
      const addSpy = vi.spyOn(messages, 'add');
      return { component, confirmSpy, addSpy };
    }

    it('asks for confirmation and does not revoke until accepted', () => {
      const { component, confirmSpy } = setup();
      const revoke = vi.spyOn(TestBed.inject(AuthService), 'revokeAllSessions');
      confirmSpy.mockReset();
      component.onRevokeAllSessions();
      expect(confirmSpy).toHaveBeenCalled();
      expect(revoke).not.toHaveBeenCalled();
    });

    it('does not reload sessions on success (auth is cleared)', () => {
      const { component } = setup();
      const auth = TestBed.inject(AuthService);
      vi.spyOn(auth, 'revokeAllSessions').mockReturnValue(of(undefined));
      const load = vi.spyOn(component, 'loadSessions');
      component.onRevokeAllSessions();
      expect(load).not.toHaveBeenCalled();
    });

    it('shows an error toast on failure', () => {
      const { component, addSpy } = setup();
      vi.spyOn(TestBed.inject(AuthService), 'revokeAllSessions').mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      component.onRevokeAllSessions();
      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });
});
