import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let mockAuthService: { signup: ReturnType<typeof vi.fn> };
  let mockToastService: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    mockAuthService = {
      signup: vi.fn().mockReturnValue(of({ user: { id: '1', email: 'test@example.com' } })),
    };
    mockToastService = { showSuccess: vi.fn(), showError: vi.fn() };

    TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: TranslocoHttpLoader,
        }),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    const fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
  });

  it('should create signup component', () => {
    expect(component).toBeTruthy();
  });

  it('should mark form touched and not submit when invalid', () => {
    component.onSubmit();
    expect(component.signupForm.touched).toBe(true);
    expect(mockAuthService.signup).not.toHaveBeenCalled();
  });

  it('should submit valid registration and navigate on success', () => {
    component.signupForm.setValue({
      fullName: 'Gordon Ramsey',
      username: 'gordon_ramsay',
      email: 'gordon@pantry.app',
      password: 'securepassword123',
    });
    component.onSubmit();

    expect(mockAuthService.signup).toHaveBeenCalledWith({
      fullName: 'Gordon Ramsey',
      username: 'gordon_ramsay',
      email: 'gordon@pantry.app',
      password: 'securepassword123',
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should set error message on signup failure', () => {
    mockAuthService.signup.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already registered' } })),
    );
    component.signupForm.setValue({
      fullName: 'Gordon Ramsey',
      username: 'gordon_ramsay',
      email: 'gordon@pantry.app',
      password: 'securepassword123',
    });
    component.onSubmit();

    expect(component.errorMessage()).toBe('Email already registered');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
  });
});
