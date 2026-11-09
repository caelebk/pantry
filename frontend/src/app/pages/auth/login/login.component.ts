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
import {
  AlertComponent,
  BadgeComponent,
  CardComponent,
  FormFieldComponent,
  SpinnerComponent,
} from '@ui';
import { InputTextModule } from 'primeng/inputtext';
import { SkilletIconComponent } from '../../../components/skillet-icon/skillet-icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'pantry-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoModule,
    InputTextModule,
    AlertComponent,
    BadgeComponent,
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
              {{ 'auth.loginHero.title' | transloco }}
            </p>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-3 leading-relaxed">
              {{ 'auth.loginHero.subtitle' | transloco }}
            </p>
          </div>

          <!-- Minimalist Clean Stock Preview Card -->
          <pantry-card variant="sub" padding="sm" class="block space-y-2.5">
            <div
              class="flex items-center justify-between text-xs font-semibold text-surface-700 dark:text-surface-200">
              <span class="flex items-center gap-2">
                <i
                  class="pi pi-building text-surface-500 dark:text-surface-400 text-sm"
                  aria-hidden="true"></i>
                {{ 'auth.loginHero.previewTitle' | transloco }}
              </span>
              <pantry-badge variant="neutral" size="sm" [dot]="true">{{
                'auth.loginHero.previewSynced' | transloco
              }}</pantry-badge>
            </div>
            <div
              class="flex items-center justify-between p-2.5 rounded-xl bg-white/60 dark:bg-surface-800/60 border border-surface-200/50 dark:border-surface-700/50">
              <span
                class="text-xs font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                {{ 'auth.loginHero.previewItem' | transloco }}
              </span>
              <pantry-badge variant="expiring" size="sm">{{
                'auth.loginHero.previewExpiry' | transloco
              }}</pantry-badge>
            </div>
          </pantry-card>
        </div>

        <!-- Minimal Footer -->
        <div class="relative z-10 text-xs text-surface-600 dark:text-surface-400 font-medium">
          {{ 'auth.loginHero.footer' | transloco }}
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
                {{ 'auth.login' | transloco }}
              </h1>
            </div>

            <!-- Inline Error Banner -->
            @if (errorMessage()) {
              <pantry-alert variant="danger">{{ errorMessage() }}</pantry-alert>
            }

            <!-- Login Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <pantry-form-field
                forId="identifier"
                icon="pi pi-user"
                [label]="'auth.emailOrUsername' | transloco"
                [error]="
                  loginForm.get('identifier')?.touched && loginForm.get('identifier')?.invalid
                    ? ('auth.identifierRequired' | transloco)
                    : undefined
                ">
                <input
                  pInputText
                  id="identifier"
                  type="text"
                  formControlName="identifier"
                  autocomplete="username"
                  class="w-full"
                  [placeholder]="'auth.emailOrUsernamePlaceholder' | transloco" />
              </pantry-form-field>

              <pantry-form-field
                forId="password"
                icon="pi pi-lock"
                [label]="'auth.password' | transloco"
                [error]="
                  loginForm.get('password')?.touched && loginForm.get('password')?.invalid
                    ? ('auth.passwordRequired' | transloco)
                    : undefined
                ">
                <div class="flex gap-2">
                  <input
                    pInputText
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="current-password"
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
              </pantry-form-field>

              <!-- Submit Button -->
              <button type="submit" [disabled]="isSubmitting()" class="btn-primary w-full mt-2">
                @if (isSubmitting()) {
                  <pantry-spinner [announce]="false" size="xs" color="white" />
                  <span>{{ 'auth.signingIn' | transloco }}</span>
                } @else {
                  <span>{{ 'auth.login' | transloco }}</span>
                }
              </button>
            </form>

            <!-- Footer Link -->
            <div class="pt-2 text-center text-sm text-surface-600 dark:text-surface-400">
              <span>{{ 'auth.dontHaveAccount' | transloco }}</span>
              <a
                routerLink="/auth/signup"
                class="ml-1.5 font-bold text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                {{ 'auth.signUpNow' | transloco }}
              </a>
            </div>
          </div>
        </pantry-card>
      </main>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private transloco = inject(TranslocoService);
  private document = inject(DOCUMENT);
  private injector = inject(Injector);

  private readonly focusOrder: [string, string][] = [
    ['identifier', 'identifier'],
    ['password', 'password'],
  ];

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDarkMode = computed(() => this.themeService.darkMode());
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

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
    const target = this.focusOrder.find(([name]) => this.loginForm.get(name)?.invalid);
    if (!target) return;
    afterNextRender(() => this.document.getElementById(target[1])?.focus(), {
      injector: this.injector,
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const { identifier, password } = this.loginForm.value;

    this.authService.login({ identifier: identifier!.trim(), password: password! }).subscribe({
      next: () => {
        this.toastService.showSuccess(this.transloco.translate('auth.loginSuccess'));
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.message || this.transloco.translate('auth.invalidCredentials');
        this.errorMessage.set(errorMsg);
        this.toastService.showError(errorMsg, this.transloco.translate('auth.loginErrorTitle'));
      },
    });
  }
}
