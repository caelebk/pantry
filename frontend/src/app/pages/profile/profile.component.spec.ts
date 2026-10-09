import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of } from 'rxjs';
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
});
