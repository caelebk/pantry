import { CommonModule, DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AlertComponent, CardComponent, FormFieldComponent, SpinnerComponent } from '@ui';
import { InputTextModule } from 'primeng/inputtext';
import { SkilletIconComponent } from '../../../components/skillet-icon/skillet-icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'pantry-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoModule,
    InputTextModule,
    AlertComponent,
    CardComponent,
    FormFieldComponent,
    SkilletIconComponent,
    SpinnerComponent,
  ],
  template: `
    <div
      class="relative min-h-full w-full flex text-surface-900 dark:text-surface-50 font-sans transition-colors duration-300 overflow-hidden">
      <!-- Top-Right Floating Theme Toggle -->
      <div class="absolute top-5 right-5 z-30">
        <button
          type="button"
          (click)="toggleTheme()"
          class="btn-icon bg-white dark:bg-surface-900"
          [attr.aria-label]="
            (isDarkMode() ? 'sidebar.switchToLight' : 'sidebar.switchToDark') | transloco
          ">
          <i
            [class]="isDarkMode() ? 'pi pi-sun text-lg' : 'pi pi-moon text-lg'"
            aria-hidden="true"></i>
        </button>
      </div>

      <!-- Left Hero Showcase Panel (Desktop Split 50%) -->
      <div class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <!-- Brand Emblem Header -->
        <div class="relative z-10 flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white">
            <pantry-skillet-icon [size]="20" />
          </div>
          <span class="type-section-title text-surface-900 dark:text-white">{{
            'app.name' | transloco
          }}</span>
        </div>

        <!-- Minimal Hero Content -->
        <div class="relative z-10 my-auto max-w-md space-y-6">
          <div>
            <p class="type-page-title text-surface-900 dark:text-white">
              {{ 'auth.signupHero.title' | transloco }}
            </p>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-3 leading-relaxed">
              {{ 'auth.signupHero.subtitle' | transloco }}
            </p>
          </div>

          <!-- Minimal Feature Cards -->
          <div class="grid grid-cols-2 gap-3">
            <pantry-card variant="sub" padding="sm" class="block space-y-1">
              <i
                class="pi pi-building text-surface-500 dark:text-surface-400 text-base"
                aria-hidden="true"></i>
              <div class="text-xs font-bold text-surface-900 dark:text-surface-100">
                {{ 'auth.signupHero.sharedKitchens' | transloco }}
              </div>
            </pantry-card>
            <pantry-card variant="sub" padding="sm" class="block space-y-1">
              <i
                class="pi pi-shield text-surface-500 dark:text-surface-400 text-base"
                aria-hidden="true"></i>
              <div class="text-xs font-bold text-surface-900 dark:text-surface-100">
                {{ 'auth.signupHero.zeroWaste' | transloco }}
              </div>
            </pantry-card>
          </div>
        </div>

        <!-- Minimal Footer -->
        <div class="relative z-10 text-xs text-surface-600 dark:text-surface-400 font-medium">
          {{ 'auth.signupHero.footer' | transloco }}
        </div>
      </div>

      <!-- Right Form Panel (100% Mobile, 50% Desktop Width) -->
      <main class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <pantry-card padding="lg" class="block w-full max-w-md">
          <div class="space-y-6">
            <!-- Mobile Brand Emblem Header -->
            <div class="lg:hidden flex flex-col items-center text-center space-y-2 mb-6">
              <div
                class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <pantry-skillet-icon [size]="22" />
              </div>
              <span class="type-section-title text-surface-900 dark:text-white">{{
                'app.name' | transloco
              }}</span>
            </div>

            <!-- Form Header -->
            <div>
              <h1 class="type-page-title text-surface-900 dark:text-white">
                {{ 'auth.signup' | transloco }}
              </h1>
            </div>

            <!-- Inline Error Banner -->
            @if (errorMessage()) {
              <pantry-alert variant="danger">{{ errorMessage() }}</pantry-alert>
            }

            <!-- Signup Form -->
            <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <pantry-form-field
                forId="fullName"
                icon="pi pi-user"
                [label]="'auth.fullName' | transloco"
                [error]="
                  signupForm.get('fullName')?.touched && signupForm.get('fullName')?.invalid
                    ? ('auth.fullNameRequired' | transloco)
                    : undefined
                ">
                <input
                  pInputText
                  id="fullName"
                  type="text"
                  formControlName="fullName"
                  autocomplete="name"
                  class="w-full"
                  [placeholder]="'auth.fullNamePlaceholder' | transloco" />
              </pantry-form-field>

              <pantry-form-field
                forId="username"
                icon="pi pi-at"
                [label]="'auth.username' | transloco"
                [error]="
                  signupForm.get('username')?.touched && signupForm.get('username')?.invalid
                    ? ('auth.usernameInvalid' | transloco)
                    : undefined
                ">
                <input
                  pInputText
                  id="username"
                  type="text"
                  formControlName="username"
                  autocomplete="username"
                  class="w-full"
                  [placeholder]="'auth.usernamePlaceholder' | transloco" />
              </pantry-form-field>

              <pantry-form-field
                forId="email"
                icon="pi pi-envelope"
                [label]="'auth.email' | transloco"
                [error]="
                  signupForm.get('email')?.touched && signupForm.get('email')?.invalid
                    ? ('auth.emailInvalid' | transloco)
                    : undefined
                ">
                <input
                  pInputText
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="w-full"
                  [placeholder]="'auth.emailPlaceholder' | transloco" />
              </pantry-form-field>

              <pantry-form-field
                forId="password"
                icon="pi pi-lock"
                [label]="'auth.password' | transloco"
                [error]="
                  signupForm.get('password')?.touched && signupForm.get('password')?.invalid
                    ? ('auth.passwordRequirementsUnmet' | transloco)
                    : undefined
                ">
                <div class="flex gap-2">
                  <input
                    pInputText
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="new-password"
                    class="w-full min-w-0"
                    placeholder="••••••••" />
                  <button
                    type="button"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="
                      (showPassword() ? 'auth.hidePassword' : 'auth.showPassword') | transloco
                    "
                    class="btn-icon shrink-0">
                    <i
                      [class]="showPassword() ? 'pi pi-eye-slash text-base' : 'pi pi-eye text-base'"
                      aria-hidden="true"></i>
                  </button>
                </div>
                @if (passwordValue()) {
                  <div
                    class="mt-2.5 p-3 rounded-xl bg-surface-100/80 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/80 space-y-2">
                    <div class="flex items-center justify-between type-meta">
                      <span class="font-semibold text-surface-600 dark:text-surface-300"
                        >{{ 'authVerification.passwordStrength' | transloco }}:</span
                      >
                      <span
                        class="font-semibold"
                        [ngClass]="{
                          'text-rose-700 dark:text-rose-300': passwordScore() <= 2,
                          'text-amber-700 dark:text-amber-300':
                            passwordScore() === 3 || passwordScore() === 4,
                          'text-emerald-700 dark:text-emerald-300': passwordScore() === 5,
                        }">
                        {{
                          (passwordScore() <= 2
                            ? 'authVerification.strengthWeak'
                            : passwordScore() <= 4
                              ? 'auth.strengthGood'
                              : 'authVerification.strengthStrong'
                          ) | transloco
                        }}
                      </span>
                    </div>
                    <!-- Progress bar -->
                    <div class="progress-track h-1.5">
                      <div
                        class="h-full transition-all duration-300 rounded-full"
                        [style.width.%]="(passwordScore() / 5) * 100"
                        [ngClass]="{
                          'bg-rose-500': passwordScore() <= 2,
                          'bg-amber-500': passwordScore() === 3 || passwordScore() === 4,
                          'bg-emerald-500': passwordScore() === 5,
                        }"></div>
                    </div>
                    <!-- Individual criteria -->
                    <div class="grid grid-cols-2 gap-1 pt-1 type-meta">
                      <div
                        class="flex items-center gap-1.5"
                        [ngClass]="
                          hasMinLength()
                            ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-surface-600 dark:text-surface-400'
                        ">
                        <i
                          [class]="hasMinLength() ? 'pi pi-check text-xs' : 'pi pi-circle text-xs'"
                          aria-hidden="true"></i>
                        <span>{{ 'auth.criteria.minLength' | transloco }}</span>
                      </div>
                      <div
                        class="flex items-center gap-1.5"
                        [ngClass]="
                          hasUpperCase()
                            ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-surface-600 dark:text-surface-400'
                        ">
                        <i
                          [class]="hasUpperCase() ? 'pi pi-check text-xs' : 'pi pi-circle text-xs'"
                          aria-hidden="true"></i>
                        <span>{{ 'auth.criteria.uppercase' | transloco }}</span>
                      </div>
                      <div
                        class="flex items-center gap-1.5"
                        [ngClass]="
                          hasLowerCase()
                            ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-surface-600 dark:text-surface-400'
                        ">
                        <i
                          [class]="hasLowerCase() ? 'pi pi-check text-xs' : 'pi pi-circle text-xs'"
                          aria-hidden="true"></i>
                        <span>{{ 'auth.criteria.lowercase' | transloco }}</span>
                      </div>
                      <div
                        class="flex items-center gap-1.5"
                        [ngClass]="
                          hasNumber()
                            ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-surface-600 dark:text-surface-400'
                        ">
                        <i
                          [class]="hasNumber() ? 'pi pi-check text-xs' : 'pi pi-circle text-xs'"
                          aria-hidden="true"></i>
                        <span>{{ 'auth.criteria.number' | transloco }}</span>
                      </div>
                      <div
                        class="flex items-center gap-1.5 col-span-2"
                        [ngClass]="
                          hasSpecial()
                            ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-surface-600 dark:text-surface-400'
                        ">
                        <i
                          [class]="hasSpecial() ? 'pi pi-check text-xs' : 'pi pi-circle text-xs'"
                          aria-hidden="true"></i>
                        <span>{{ 'auth.criteria.special' | transloco }}</span>
                      </div>
                    </div>
                  </div>
                }
              </pantry-form-field>

              <!-- Submit Button -->
              <button type="submit" [disabled]="isSubmitting()" class="btn-primary w-full mt-2">
                @if (isSubmitting()) {
                  <pantry-spinner [announce]="false" size="xs" color="white" />
                  <span>{{ 'auth.creatingAccount' | transloco }}</span>
                } @else {
                  <span>{{ 'auth.signup' | transloco }}</span>
                }
              </button>
            </form>

            <!-- Footer Link -->
            <div class="pt-2 text-center text-sm text-surface-600 dark:text-surface-400">
              <span>{{ 'auth.alreadyHaveAccount' | transloco }}</span>
              <a
                routerLink="/auth/login"
                class="ml-1.5 font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                {{ 'auth.signInNow' | transloco }}
              </a>
            </div>
          </div>
        </pantry-card>
      </main>
    </div>
  `,
})
export class SignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private transloco = inject(TranslocoService);
  private document = inject(DOCUMENT);
  private injector = inject(Injector);

  private readonly focusOrder: [string, string][] = [
    ['fullName', 'fullName'],
    ['username', 'username'],
    ['email', 'email'],
    ['password', 'password'],
  ];

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDarkMode = computed(() => this.themeService.darkMode());
  readonly errorMessage = signal<string | null>(null);

  // Strong password regex validator requiring uppercase, lowercase, number, special char, min 8
  private static strongPasswordValidator(control: import('@angular/forms').AbstractControl) {
    const val = control.value || '';
    if (!val) return null;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum = /[0-9]/.test(val);
    const hasSpecial = /[^a-zA-Z0-9\s]/.test(val);
    const hasMinLength = val.length >= 8;

    if (hasUpper && hasLower && hasNum && hasSpecial && hasMinLength) {
      return null;
    }
    return { strongPassword: true };
  }

  readonly signupForm = this.fb.group({
    fullName: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,30}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, SignupComponent.strongPasswordValidator]],
  });

  get passwordValue(): () => string {
    return () => this.signupForm.get('password')?.value || '';
  }

  hasMinLength(): boolean {
    return this.passwordValue().length >= 8;
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.passwordValue());
  }

  hasLowerCase(): boolean {
    return /[a-z]/.test(this.passwordValue());
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.passwordValue());
  }

  hasSpecial(): boolean {
    return /[^a-zA-Z0-9\s]/.test(this.passwordValue());
  }

  passwordScore(): number {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUpperCase()) score++;
    if (this.hasLowerCase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecial()) score++;
    return score;
  }

  ngOnInit() {
    this.themeService.initializeFromDocument();
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  private focusFirstInvalid() {
    const target = this.focusOrder.find(([name]) => this.signupForm.get(name)?.invalid);
    if (!target) return;
    afterNextRender(() => this.document.getElementById(target[1])?.focus(), {
      injector: this.injector,
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const { fullName, username, email, password } = this.signupForm.value;

    this.authService
      .signup({
        fullName: fullName!,
        username: username?.trim() || undefined,
        email: email!,
        password: password!,
      })
      .subscribe({
        next: () => {
          this.toastService.showSuccess(this.transloco.translate('auth.signupSuccess'));
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMsg = err.error?.message || this.transloco.translate('auth.signupFailed');
          this.errorMessage.set(errorMsg);
          this.toastService.showError(errorMsg, this.transloco.translate('auth.signupErrorTitle'));
        },
      });
  }
}
