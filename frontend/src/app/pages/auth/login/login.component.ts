import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NgZone,
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
  selector: 'pantry-login',
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
        class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-orange-600/10 via-surface-900 to-amber-950/40 dark:from-orange-950/40 dark:via-surface-950 dark:to-black border-r border-surface-200/50 dark:border-surface-800/50">
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

        <!-- Hero Content & Mock Interactive Card -->
        <div class="relative z-10 my-auto max-w-lg space-y-8">
          <div>
            <span
              class="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20 text-xs font-semibold uppercase tracking-wider">
              Smart Kitchen Management
            </span>
            <h1
              class="text-4xl xl:text-5xl font-extrabold tracking-tight text-surface-900 dark:text-white mt-4 leading-tight">
              Master your kitchen,
              <span
                class="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent"
                >together.</span
              >
            </h1>
            <p class="text-base text-surface-600 dark:text-surface-400 mt-4 leading-relaxed">
              Track real-time inventory, collaborate across shared kitchens, eliminate food waste,
              and automatically match recipes with what's in your fridge.
            </p>
          </div>

          <!-- Interactive Mock Inventory Showcase Card -->
          <div
            class="p-6 rounded-2xl bg-white/70 dark:bg-surface-900/60 border border-surface-200/80 dark:border-surface-800/80 backdrop-blur-xl shadow-2xl space-y-4">
            <div
              class="flex items-center justify-between border-b border-surface-200/60 dark:border-surface-800 pb-3">
              <div class="flex items-center gap-2">
                <i class="pi pi-building text-orange-500"></i>
                <span
                  class="text-xs font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300"
                  >Bistro Main Kitchen</span
                >
              </div>
              <span
                class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
                >Live Sync</span
              >
            </div>

            <div class="space-y-2.5">
              <div
                class="flex items-center justify-between p-2.5 rounded-xl bg-surface-100/80 dark:bg-surface-800/60">
                <div class="flex items-center gap-3">
                  <span class="text-lg">🥩</span>
                  <div>
                    <div class="text-xs font-semibold text-surface-900 dark:text-surface-100">
                      Wagyu Ribeye Steak
                    </div>
                    <div class="text-[10px] text-surface-500">2.5 kg • Fridge Main</div>
                  </div>
                </div>
                <span
                  class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 text-[10px] font-semibold"
                  >Exp. 2 days</span
                >
              </div>

              <div
                class="flex items-center justify-between p-2.5 rounded-xl bg-surface-100/80 dark:bg-surface-800/60">
                <div class="flex items-center gap-3">
                  <span class="text-lg">🌿</span>
                  <div>
                    <div class="text-xs font-semibold text-surface-900 dark:text-surface-100">
                      Fresh Genovese Basil
                    </div>
                    <div class="text-[10px] text-surface-500">150 g • Pantry Herb Shelf</div>
                  </div>
                </div>
                <span
                  class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[10px] font-semibold"
                  >Fresh</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Badges -->
        <div
          class="relative z-10 flex items-center gap-6 text-xs font-medium text-surface-500 dark:text-surface-400">
          <span class="flex items-center gap-1.5"
            ><i class="pi pi-check-circle text-orange-500"></i> Multi-User Shared Access</span
          >
          <span class="flex items-center gap-1.5"
            ><i class="pi pi-check-circle text-orange-500"></i> Automatic Recipe Matching</span
          >
        </div>
      </div>

      <!-- Right Form Panel (100% Mobile, 50% Desktop Width) -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div class="w-full max-w-md space-y-8">
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
              {{ 'auth.welcomeBack' | transloco }}
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
              {{ 'auth.welcomeSubtitle' | transloco }}
            </p>
          </div>

          <!-- Inline Alert Error Banner -->
          @if (errorMessage()) {
            <div
              role="alert"
              class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-base shrink-0"></i>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Login Reactive Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
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
                  aria-describedby="email-error"
                  class="w-full h-[42px] pl-10 pr-4 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-50 text-sm placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                  placeholder="chef@pantry.app" />
              </div>
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
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
                  class="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300">
                  {{ 'auth.password' | transloco }}
                </label>
                <button
                  type="button"
                  class="text-xs font-semibold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer">
                  {{ 'auth.forgotPassword' | transloco }}
                </button>
              </div>
              <div class="relative">
                <i
                  class="pi pi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"></i>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  aria-describedby="password-error"
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
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                <div
                  id="password-error"
                  role="alert"
                  class="text-xs text-rose-500 dark:text-rose-400 mt-1">
                  Password is required.
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
                <span>Signing in...</span>
              } @else {
                <span>{{ 'auth.login' | transloco }}</span>
              }
            </button>
          </form>

          <!-- Footer Link -->
          <div class="pt-4 text-center text-sm text-surface-600 dark:text-surface-400">
            <span>{{ 'auth.dontHaveAccount' | transloco }}</span>
            <a
              routerLink="/auth/signup"
              class="ml-1.5 font-bold text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              {{ 'auth.signUpNow' | transloco }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private ngZone = inject(NgZone);

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly isDarkMode = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private animationFrameId?: number;
  private resizeListener?: () => void;
  private particles: Particle[] = [];

  ngOnInit() {
    this.isDarkMode.set(document.documentElement.classList.contains('dark'));
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.initCanvasAnimation();
    });
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  toggleTheme() {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    this.isDarkMode.set(isDarkNow);
  }

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.toastService.showSuccess('Login successful. Welcome back!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errorMsg = err.error?.message || 'Invalid email or password.';
        this.errorMessage.set(errorMsg);
        this.toastService.showError(errorMsg, 'Authentication Error');
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

    this.resizeListener = () => {
      const p = canvas.parentElement;
      if (p) {
        canvas.width = p.clientWidth;
        canvas.height = p.clientHeight;
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener);
    }

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
