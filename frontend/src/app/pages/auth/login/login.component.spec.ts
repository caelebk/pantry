import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let mockAuthService: { login: ReturnType<typeof vi.fn> };
  let mockToastService: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    mockAuthService = {
      login: vi.fn().mockReturnValue(of({ user: { id: '1', email: 'test@example.com' } })),
    };
    mockToastService = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: class {
            getTranslation = () =>
              of({ auth: { identifierRequired: 'Please enter your email or username.' } });
          },
        }),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create login component', () => {
    expect(component).toBeTruthy();
  });

  it('should mark form touched and not submit when invalid', () => {
    component.onSubmit();
    expect(component.loginForm.touched).toBe(true);
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('should submit valid credentials and navigate on success', () => {
    component.loginForm.setValue({ identifier: 'chef@pantry.app', password: 'password123' });
    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      identifier: 'chef@pantry.app',
      password: 'password123',
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should set error message on login failure', () => {
    mockAuthService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );
    component.loginForm.setValue({ identifier: 'chef@pantry.app', password: 'wrong' });
    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
  });

  it('should not render a forgot password control (no reset flow exists)', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    expect(buttons.some((button) => /forgot/i.test(button.textContent ?? ''))).toBe(false);
    expect(buttons.some((button) => button.textContent?.includes('auth.forgotPassword'))).toBe(
      false,
    );
  });

  it('should focus the first invalid input when submitting an invalid form', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.loginForm.touched).toBe(true);
    expect(document.activeElement?.id).toBe('identifier');
    expect(document.activeElement?.getAttribute('aria-invalid')).toBe('true');
  });
});
