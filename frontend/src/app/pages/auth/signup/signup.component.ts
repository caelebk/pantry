import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../services/toast.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

@Component({
  selector: 'pantry-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  template: `
    <div
      class="relative min-h-screen w-full flex bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 font-sans transition-colors duration-300 overflow-hidden">
      <!-- Top-Right Floating Controls (Theme Toggle) -->
      <div class="absolute top-5 right-5 z-30 flex items-center gap-3">
        <button
          type="button"
          (click)="toggleTheme()"
          class="w-10 h-10 rounded-xl bg-white/80 dark:bg-surface-900/80 border border-surface-200/80 dark:border-surface-800 backdrop-blur-xl flex items-center justify-center text-surface-700 dark:text-surface-200 hover:text-orange-500 dark:hover:text-orange-400 shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
          [attr.aria-label]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <i
            [class]="
              isDarkMode()
                ? 'pi pi-sun text-amber-400 text-lg'
                : 'pi pi-moon text-indigo-500 text-lg'
            "></i>
        </button>
      </div>

      <!-- Left Hero Showcase Panel (Desktop lg:flex 50% Width) -->
      <div
        class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-amber-600/10 via-surface-900 to-orange-950/40 dark:from-amber-950/40 dark:via-surface-950 dark:to-black border-r border-surface-200/50 dark:border-surface-800/50">
        <!-- Interactive Orange Graph Canvas Layer -->
        <canvas
          #bgCanvas
          class="absolute inset-0 z-0 pointer-events-none opacity-80"
          aria-hidden="true"></canvas>

        <!-- Brand Top Header -->
        <div class="relative z-10 flex items-center gap-2.5">
          <div
            class="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 flex items-center justify-center">
            <span class="material-symbols-outlined text-[16px]">skillet</span>
          </div>
          <span
            class="text-xs font-light tracking-[0.3em] uppercase text-surface-800 dark:text-surface-200">
            Pantry
          </span>
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 my-auto max-w-lg space-y-8">
          <div>
            <span
              class="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20 text-xs font-semibold uppercase tracking-wider">
              Start Your Free Workspace
            </span>
            <h1
              class="text-4xl xl:text-5xl font-extrabold tracking-tight text-surface-900 dark:text-white mt-4 leading-tight">
              Organize your kitchen,
              <span
                class="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent"
                >effortlessly.</span
              >
            </h1>
            <p class="text-base text-surface-600 dark:text-surface-400 mt-4 leading-relaxed">
              Create your account in 30 seconds. Automatically provision a shared kitchen workspace,
              invite family members, and start tracking inventory.
            </p>
          </div>

          <!-- Feature Cards Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div
              class="p-4 rounded-2xl bg-white/70 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl space-y-2">
              <i class="pi pi-building text-orange-500 text-xl"></i>
              <div class="text-xs font-bold text-surface-900 dark:text-surface-100">
                Shared Workspaces
              </div>
              <div class="text-[11px] text-surface-500">
                Collaborate with family & team members in real-time.
              </div>
            </div>
            <div
              class="p-4 rounded-2xl bg-white/70 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl space-y-2">
              <i class="pi pi-shield text-amber-500 text-xl"></i>
              <div class="text-xs font-bold text-surface-900 dark:text-surface-100">
                Enterprise Security
              </div>
              <div class="text-[11px] text-surface-500">
                Argon2id encryption & session protection.
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Badges -->
        <div
          class="relative z-10 flex items-center gap-6 text-xs font-medium text-surface-500 dark:text-surface-400">
          <span class="flex items-center gap-1.5"
            ><i class="pi pi-check-circle text-orange-500"></i> No Credit Card Required</span
          >
          <span class="flex items-center gap-1.5"
            ><i class="pi pi-check-circle text-orange-500"></i> Instant Workspace Provisioning</span
          >
        </div>
      </div>

      <!-- Right Form Panel (100% Mobile, 50% Desktop Width) -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div class="w-full max-w-md space-y-7">
          <!-- Mobile Brand Logo Header -->
          <div class="lg:hidden text-center mb-6">
            <div
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 mb-2">
              <span class="material-symbols-outlined text-[18px]">skillet</span>
            </div>
            <h1
              class="text-xs font-light tracking-[0.3em] uppercase text-surface-800 dark:text-surface-200">
              Pantry
            </h1>
          </div>

          <!-- Form Header -->
          <div>
            <h2
              class="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
              {{ 'auth.createAccountTitle' | transloco }}
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
              {{ 'auth.createAccountSubtitle' | transloco }}
            </p>
          </div>

          <!-- Inline Error Banner -->
          @if (errorMessage()) {
            <div
              role="alert"
              class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-base shrink-0"></i>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Signup Reactive Form -->
          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Full Name Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="fullName"
                  class="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300">
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
                  class="w-full h-[42px] pl-10 pr-4 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                  placeholder="Chef Gordon Ramsey" />
              </div>
              @if (signupForm.get('fullName')?.touched && signupForm.get('fullName')?.invalid) {
                <div class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Full name is required.
                </div>
              }
            </div>

            <!-- Email Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="email"
                  class="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300">
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
                  class="w-full h-[42px] pl-10 pr-4 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                  placeholder="chef@pantry.app" />
              </div>
              @if (signupForm.get('email')?.touched && signupForm.get('email')?.invalid) {
                <div class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Please enter a valid email address.
                </div>
              }
            </div>

            <!-- Password Field -->
            <div>
              <div class="flex items-center justify-between h-6 mb-1.5">
                <label
                  for="password"
                  class="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300">
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
                  class="w-full h-[42px] pl-10 pr-12 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
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
                <div class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Password must be at least 8 characters.
                </div>
              }
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="w-full h-[42px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer">
              @if (isSubmitting()) {
                <i class="pi pi-spin pi-spinner text-sm"></i>
                <span>Creating Account...</span>
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
              class="ml-1.5 font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              {{ 'auth.signInNow' | transloco }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SignupComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;

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
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private animationFrameId?: number;
  private particles: Particle[] = [];

  ngOnInit() {
    this.isDarkMode.set(document.documentElement.classList.contains('dark'));
  }

  ngAfterViewInit() {
    this.initCanvasAnimation();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
  }

  toggleTheme() {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    this.isDarkMode.set(isDarkNow);
  }

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  onGoogleLogin() {
    this.toastService.showInfo('Google OAuth is coming soon!');
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const { fullName, email, password } = this.signupForm.value;

    this.authService.signup({ fullName: fullName!, email: email!, password: password! }).subscribe({
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

  private initCanvasAnimation() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    const width = (canvas.width = parent ? parent.clientWidth : 600);
    const height = (canvas.height = parent ? parent.clientHeight : 800);

    const count = 45;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1.5,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Graph Edges (Connecting Lines)
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i];
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(249, 115, 22, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw Particle Graph Nodes
      this.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.5)';
        ctx.fill();
      });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
}
