import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'pantry-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  template: `
    <div
      class="relative min-h-screen w-full flex animated-gradient-bg text-surface-900 dark:text-surface-50 font-sans transition-colors duration-300 overflow-hidden">
      <!-- Top-Right Floating Theme Toggle -->
      <div class="absolute top-5 right-5 z-30">
        <button
          type="button"
          (click)="toggleTheme()"
          class="w-10 h-10 rounded-xl bg-white/80 dark:bg-surface-900/80 border border-surface-200/80 dark:border-surface-800 backdrop-blur-xl flex items-center justify-center text-surface-700 dark:text-surface-200 hover:text-primary-500 dark:hover:text-primary-400 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          [attr.aria-label]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <i
            [class]="
              isDarkMode()
                ? 'pi pi-sun text-amber-400 text-lg'
                : 'pi pi-moon text-indigo-500 text-lg'
            "></i>
        </button>
      </div>

      <!-- Left Hero Showcase Panel (Desktop Split 50%) -->
      <div
        class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-surface-100/50 dark:bg-surface-900/40 backdrop-blur-md border-r border-surface-200/80 dark:border-surface-800/80 overflow-hidden">
        <!-- Floating Kitchen & Food Organization Watermark Vector Shapes Layer -->
        <div class="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
          <!-- Pantry Storage Jar Vector -->
          <svg
            class="vector-float-slow absolute -top-6 -right-6 w-56 h-56 text-primary-500/10 dark:text-primary-400/10"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5">
            <rect x="25" y="30" width="50" height="58" rx="8" />
            <rect x="30" y="18" width="40" height="12" rx="4" />
            <path d="M 35,18 L 35,12 C 35,10 65,10 65,12 L 65,18" />
            <path d="M 30,50 Q 50,46 70,50" stroke-dasharray="3 3" />
            <path d="M 30,68 Q 50,64 70,68" stroke-dasharray="3 3" />
          </svg>

          <!-- Skillet & Cooking Pan Vector -->
          <svg
            class="vector-float-medium absolute -bottom-10 -left-10 w-64 h-64 text-amber-500/10 dark:text-amber-400/10"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5">
            <circle cx="42" cy="50" r="32" />
            <circle cx="42" cy="50" r="26" stroke-dasharray="4 3" />
            <path d="M 68,66 L 92,84" stroke-width="3" stroke-linecap="round" />
            <circle cx="90" cy="82" r="2.5" fill="currentColor" />
          </svg>

          <!-- Refrigerator Storage Cabinet Vector -->
          <svg
            class="vector-float-fast absolute top-1/4 -left-12 w-48 h-48 text-orange-500/10 dark:text-orange-400/10"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5">
            <rect x="25" y="15" width="50" height="70" rx="6" />
            <line x1="25" y1="42" x2="75" y2="42" />
            <line x1="32" y1="28" x2="32" y2="36" stroke-width="2" stroke-linecap="round" />
            <line x1="32" y1="48" x2="32" y2="60" stroke-width="2" stroke-linecap="round" />
          </svg>

          <!-- Crossed Utensils & Spatula Vector -->
          <svg
            class="vector-float-slow absolute bottom-1/4 -right-10 w-52 h-52 text-amber-500/10 dark:text-amber-400/10"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5">
            <path d="M 25,25 L 75,75" stroke-width="2" stroke-linecap="round" />
            <rect x="18" y="14" width="14" height="18" rx="2" transform="rotate(-45 25 23)" />
            <path d="M 75,25 L 25,75" stroke-width="2" stroke-linecap="round" />
            <circle cx="75" cy="25" r="5" fill="currentColor" fill-opacity="0.2" />
          </svg>

          <!-- Fresh Produce Apple Vector -->
          <svg
            class="vector-float-medium absolute top-12 right-1/3 w-36 h-36 text-emerald-500/10 dark:text-emerald-400/10"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5">
            <path
              d="M 50,35 C 40,20 20,25 20,48 C 20,72 40,85 50,82 C 60,85 80,72 80,48 C 80,25 60,20 50,35 Z" />
            <path d="M 50,32 Q 54,20 60,15" stroke-width="2" stroke-linecap="round" />
            <path
              d="M 54,22 Q 68,18 64,28 Q 54,28 54,22 Z"
              fill="currentColor"
              fill-opacity="0.2" />
          </svg>
        </div>

        <!-- Brand Emblem Header -->
        <div class="relative z-10 flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">
            <span class="material-symbols-outlined text-[20px]">skillet</span>
          </div>
          <span class="text-xl font-bold tracking-tight text-surface-900 dark:text-white">
            Pantry
          </span>
        </div>

        <!-- Minimal Hero Content -->
        <div class="relative z-10 my-auto max-w-md space-y-6">
          <div>
            <h1
              class="text-4xl xl:text-5xl font-extrabold tracking-tight text-surface-900 dark:text-white leading-tight">
              Organize your kitchen.
            </h1>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-3 leading-relaxed">
              Create shared pantries, invite housemates, and track ingredients.
            </p>
          </div>

          <!-- Minimal Feature Cards -->
          <div class="grid grid-cols-2 gap-3">
            <div
              class="glass-card p-3.5 rounded-xl border border-surface-200/80 dark:border-surface-800/80 space-y-1 shadow-sm">
              <i class="pi pi-building text-primary-500 text-base"></i>
              <div class="text-xs font-bold text-surface-900 dark:text-surface-100">
                Shared Kitchens
              </div>
            </div>
            <div
              class="glass-card p-3.5 rounded-xl border border-surface-200/80 dark:border-surface-800/80 space-y-1 shadow-sm">
              <i class="pi pi-shield text-amber-500 text-base"></i>
              <div class="text-xs font-bold text-surface-900 dark:text-surface-100">
                Zero-Waste Tracking
              </div>
            </div>
          </div>
        </div>

        <!-- Minimal Footer -->
        <div class="relative z-10 text-xs text-surface-400 dark:text-surface-500 font-medium">
          Smart workspace for home & shared kitchens.
        </div>
      </div>

      <!-- Right Form Panel (100% Mobile, 50% Desktop Width) -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div class="w-full max-w-md space-y-6">
          <!-- Mobile Brand Emblem Header -->
          <div class="lg:hidden flex flex-col items-center text-center space-y-2 mb-6">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">
              <span class="material-symbols-outlined text-[22px]">skillet</span>
            </div>
            <span class="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
              Pantry
            </span>
          </div>

          <!-- Form Header -->
          <div>
            <h1
              class="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              {{ 'auth.signup' | transloco }}
            </h1>
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {{ 'auth.createAccountSubtitle' | transloco }}
            </p>
          </div>

          <!-- Inline Error Banner -->
          @if (errorMessage()) {
            <div
              role="alert"
              class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-base shrink-0"></i>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Signup Form -->
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Full Name Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="fullName"
                  class="text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                  {{ 'auth.fullName' | transloco }}
                </label>
              </div>
              <div class="relative">
                <i
                  class="pi pi-user absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"></i>
                <input
                  id="fullName"
                  type="text"
                  formControlName="fullName"
                  aria-describedby="fullName-error"
                  class="w-full h-[42px] pl-10 pr-4 rounded-xl bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                  placeholder="Chef Gordon Ramsey" />
              </div>
              @if (signupForm.get('fullName')?.touched && signupForm.get('fullName')?.invalid) {
                <div
                  id="fullName-error"
                  role="alert"
                  class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Full name is required.
                </div>
              }
            </div>

            <!-- Username Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="username"
                  class="text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                  {{ 'auth.username' | transloco }}
                </label>
              </div>
              <div class="relative">
                <i
                  class="pi pi-at absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"></i>
                <input
                  id="username"
                  type="text"
                  formControlName="username"
                  aria-describedby="username-error"
                  class="w-full h-[42px] pl-10 pr-4 rounded-xl bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                  placeholder="chef_ramsay" />
              </div>
              @if (signupForm.get('username')?.touched && signupForm.get('username')?.invalid) {
                <div
                  id="username-error"
                  role="alert"
                  class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Username must be 3-30 letters, numbers, or underscores.
                </div>
              }
            </div>

            <!-- Email Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="email"
                  class="text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                  {{ 'auth.email' | transloco }}
                </label>
              </div>
              <div class="relative">
                <i
                  class="pi pi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"></i>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  aria-describedby="email-error"
                  class="w-full h-[42px] pl-10 pr-4 rounded-xl bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                  placeholder="chef@pantry.app" />
              </div>
              @if (signupForm.get('email')?.touched && signupForm.get('email')?.invalid) {
                <div
                  id="email-error"
                  role="alert"
                  class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Please enter a valid email address.
                </div>
              }
            </div>

            <!-- Password Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="password"
                  class="text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                  {{ 'auth.password' | transloco }}
                </label>
              </div>
              <div class="relative">
                <i
                  class="pi pi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"></i>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  aria-describedby="password-error"
                  class="w-full h-[42px] pl-10 pr-12 rounded-xl bg-white/80 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                  placeholder="••••••••" />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  class="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors focus:outline-none cursor-pointer">
                  <i
                    [class]="
                      showPassword() ? 'pi pi-eye-slash text-base' : 'pi pi-eye text-base'
                    "></i>
                </button>
              </div>
              @if (signupForm.get('password')?.touched && signupForm.get('password')?.invalid) {
                <div
                  id="password-error"
                  role="alert"
                  class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Password must be at least 8 characters.
                </div>
              }
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="w-full h-[42px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer">
              @if (isSubmitting()) {
                <i class="pi pi-spin pi-spinner text-sm"></i>
                <span>Creating Account...</span>
              } @else {
                <span>{{ 'auth.signup' | transloco }}</span>
              }
            </button>
          </form>

          <!-- Footer Link -->
          <div class="pt-2 text-center text-sm text-surface-500 dark:text-surface-400">
            <span>{{ 'auth.alreadyHaveAccount' | transloco }}</span>
            <a
              routerLink="/auth/login"
              class="ml-1.5 font-bold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {{ 'auth.signInNow' | transloco }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SignupComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDarkMode = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly signupForm = this.fb.group({
    fullName: ['', [Validators.required]],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,30}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() {
    this.isDarkMode.set(document.documentElement.classList.contains('dark'));
  }

  toggleTheme() {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    this.isDarkMode.set(isDarkNow);
  }

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
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
          this.toastService.showSuccess('Account created! Welcome to Pantry.');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMsg = err.error?.message || 'Failed to create account.';
          this.errorMessage.set(errorMsg);
          this.toastService.showError(errorMsg, 'Signup Error');
        },
      });
  }
}
