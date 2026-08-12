import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { Tab } from './components/tabs/tabs.model';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthService } from './core/services/auth.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export type KitchenVectorType =
  | 'spatula'
  | 'pan'
  | 'whisk'
  | 'chefHat'
  | 'rollingPin'
  | 'pot'
  | 'saltShaker'
  | 'forkKnife'
  | 'ladle'
  | 'cleaver';

export interface KitchenVector {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  scale: number;
  opacity: number;
  type: KitchenVectorType;
}

@Component({
  selector: 'pantry-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    RouterOutlet,
    ToastContainerComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas') particleCanvas?: ElementRef<HTMLCanvasElement>;

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  Tab = Tab; // Expose enum to template
  title = 'Pantry';
  darkMode = signal(true);
  currentTab = signal<Tab>(Tab.Home);
  isAuthRoute = signal(false);

  private animationFrameId?: number;
  private particles: Particle[] = [];
  private kitchenVectors: KitchenVector[] = [];
  private mouse = { x: -1000, y: -1000, radius: 140 };
  private resizeListener?: () => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private mouseLeaveListener?: () => void;

  constructor() {
    effect(
      () => {
        const user = this.authService.currentUser();
        if (user && user.themePreference) {
          let isDark = true;
          if (user.themePreference === 'dark') {
            isDark = true;
          } else if (user.themePreference === 'light') {
            isDark = false;
          } else {
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          }

          this.darkMode.set(isDark);
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      { allowSignalWrites: true },
    );
  }

  toggleTheme() {
    this.darkMode.update((val) => !val);
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  ngOnInit() {
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
    }

    const defaultW =
      isPlatformBrowser(this.platformId) && typeof window !== 'undefined'
        ? window.innerWidth
        : 1200;
    const defaultH =
      isPlatformBrowser(this.platformId) && typeof window !== 'undefined'
        ? window.innerHeight
        : 800;
    this.createKitchenVectors(defaultW, defaultH);

    this.isAuthRoute.set(this.router.url.startsWith('/auth'));

    // Sync currentTab & isAuthRoute with the current route
    this.router.events
      .pipe(
        filter((event: Event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.isAuthRoute.set(url.startsWith('/auth'));
        if (url.length > 1) {
          const param = url.split('/')[1];
          this.updateCurrentTabFromUrl(param);
        }
      });

    // Safeguard: Initialize currentTab based on the initial URL
    const currentParam = this.router.url.split('/')[1];
    if (currentParam) {
      this.updateCurrentTabFromUrl(currentParam);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.particleCanvas) {
      this.ngZone.runOutsideAngular(() => {
        this.initParticleWeb();
      });
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (isPlatformBrowser(this.platformId)) {
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
      }
      if (this.mouseMoveListener) {
        window.removeEventListener('mousemove', this.mouseMoveListener);
      }
      if (this.mouseLeaveListener) {
        window.removeEventListener('mouseleave', this.mouseLeaveListener);
      }
    }
  }

  private initParticleWeb() {
    const canvas = this.particleCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.createParticles(canvas.width, canvas.height);
      this.createKitchenVectors(canvas.width, canvas.height);
    };

    setupCanvasSize();

    this.resizeListener = () => setupCanvasSize();
    window.addEventListener('resize', this.resizeListener);

    this.mouseMoveListener = (e: MouseEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    this.mouseLeaveListener = () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    };

    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseleave', this.mouseLeaveListener);

    const animate = () => {
      this.renderParticlesAndVectors(ctx, canvas.width, canvas.height);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private createParticles(width: number, height: number) {
    // Dynamic particle count based on screen area (capped for optimal performance)
    const particleCount = Math.min(Math.floor((width * height) / 18000), 55);
    const colors = ['#f97316', '#f59e0b', '#fb923c', '#d97706'];

    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private createKitchenVectors(width: number, height: number) {
    const types: KitchenVectorType[] = [
      'spatula',
      'pan',
      'whisk',
      'chefHat',
      'rollingPin',
      'pot',
      'saltShaker',
      'forkKnife',
      'ladle',
      'cleaver',
    ];

    const count = Math.min(Math.max(Math.floor((width * height) / 45000), 12), 24);
    this.kitchenVectors = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      this.kitchenVectors.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.006,
        scale: Math.random() * 0.35 + 0.65,
        opacity: Math.random() * 0.2 + 0.15,
        type,
      });
    }
  }

  private renderParticlesAndVectors(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    const isDark = this.darkMode();

    // ── 1. Render Floating Particles & Web ─────────────────────
    const maxConnectDistance = 130;
    const maxConnectDistanceSq = maxConnectDistance * maxConnectDistance;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const distSq = dx * dx + dy * dy;
      const mouseRadiusSq = this.mouse.radius * this.mouse.radius;

      if (distSq < mouseRadiusSq && distSq > 0) {
        const force = (1 - distSq / mouseRadiusSq) * 1.2;
        const angle = Math.atan2(dy, dx);
        p.x += Math.cos(angle) * force;
        p.y += Math.sin(angle) * force;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = isDark ? 0.55 : 0.45;
      ctx.fill();

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const pdx = p.x - p2.x;
        const pdy = p.y - p2.y;
        const pDistSq = pdx * pdx + pdy * pdy;

        if (pDistSq < maxConnectDistanceSq) {
          const alpha = (1 - Math.sqrt(pDistSq) / maxConnectDistance) * (isDark ? 0.22 : 0.16);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = isDark
            ? 'rgba(249, 115, 22, ' + alpha + ')'
            : 'rgba(217, 119, 6, ' + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1.0;

    // ── 2. Render Minimalist Thin-Lined Kitchen Vectors ─────────
    const vectorColorPrefix = isDark ? 'rgba(251, 146, 60, ' : 'rgba(217, 119, 6, ';

    for (const v of this.kitchenVectors) {
      v.x += v.vx;
      v.y += v.vy;
      v.rotation += v.vRot;

      const margin = 45;
      if (v.x < -margin) v.x = width + margin;
      if (v.x > width + margin) v.x = -margin;
      if (v.y < -margin) v.y = height + margin;
      if (v.y > height + margin) v.y = -margin;

      // Mouse repulsion for kitchen vectors
      const dx = v.x - this.mouse.x;
      const dy = v.y - this.mouse.y;
      const distSq = dx * dx + dy * dy;
      const mouseRadiusSq = this.mouse.radius * 1.1 * (this.mouse.radius * 1.1);

      if (distSq < mouseRadiusSq && distSq > 0) {
        const force = (1 - distSq / mouseRadiusSq) * 0.9;
        const angle = Math.atan2(dy, dx);
        v.x += Math.cos(angle) * force;
        v.y += Math.sin(angle) * force;
      }

      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.rotation);
      ctx.scale(v.scale, v.scale);

      const alphaVal = v.opacity * (isDark ? 0.9 : 0.75);
      ctx.strokeStyle = vectorColorPrefix + alphaVal + ')';
      ctx.lineWidth = 1.25 / v.scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      this.drawKitchenVectorShape(ctx, v.type);
      ctx.restore();
    }
  }

  private drawKitchenVectorShape(ctx: CanvasRenderingContext2D, type: KitchenVectorType) {
    ctx.beginPath();
    switch (type) {
      case 'spatula':
        // Handle
        ctx.moveTo(0, 22);
        ctx.lineTo(0, 4);
        // Slotted blade
        ctx.moveTo(-7, 4);
        ctx.lineTo(-9, -20);
        ctx.lineTo(9, -20);
        ctx.lineTo(7, 4);
        ctx.closePath();
        // Slots
        ctx.moveTo(-4, -16);
        ctx.lineTo(-3, -4);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, -4);
        ctx.moveTo(4, -16);
        ctx.lineTo(3, -4);
        // Hanging hole
        ctx.moveTo(0, 25);
        ctx.arc(0, 22, 2, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'pan':
        // Main pan circle
        ctx.arc(-5, 0, 14, 0, Math.PI * 2);
        // Handle extending to the right
        ctx.moveTo(9, 0);
        ctx.lineTo(26, 0);
        // Hanging hole on handle tip
        ctx.moveTo(28.5, 0);
        ctx.arc(26, 0, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'whisk':
        // Handle
        ctx.rect(-2.5, 4, 5, 18);
        // Wire loops
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-14, -6, -14, -22, 0, -24);
        ctx.bezierCurveTo(14, -22, 14, -6, 0, 4);
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-8, -6, -8, -20, 0, -24);
        ctx.bezierCurveTo(8, -20, 8, -6, 0, 4);
        ctx.moveTo(0, 4);
        ctx.lineTo(0, -24);
        ctx.stroke();
        break;

      case 'chefHat':
        // Base band
        ctx.rect(-14, 6, 28, 8);
        // Fluffy crown curves
        ctx.moveTo(-14, 6);
        ctx.bezierCurveTo(-22, -4, -14, -22, -6, -18);
        ctx.bezierCurveTo(-4, -28, 4, -28, 6, -18);
        ctx.bezierCurveTo(14, -22, 22, -4, 14, 6);
        ctx.stroke();
        break;

      case 'rollingPin':
        // Central barrel
        ctx.rect(-16, -7, 32, 14);
        // Left handle
        ctx.moveTo(-16, -3);
        ctx.lineTo(-25, -2);
        ctx.lineTo(-25, 2);
        ctx.lineTo(-16, 3);
        // Right handle
        ctx.moveTo(16, -3);
        ctx.lineTo(25, -2);
        ctx.lineTo(25, 2);
        ctx.lineTo(16, 3);
        ctx.stroke();
        break;

      case 'pot':
        // Pot body
        ctx.moveTo(-16, -4);
        ctx.lineTo(-16, 12);
        ctx.arcTo(-16, 16, -12, 16, 4);
        ctx.lineTo(12, 16);
        ctx.arcTo(16, 16, 16, 12, 4);
        ctx.lineTo(16, -4);
        ctx.closePath();
        // Lid rim & knob
        ctx.moveTo(-18, -4);
        ctx.lineTo(18, -4);
        ctx.moveTo(3, -8);
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        // Side handles
        ctx.moveTo(-16, 0);
        ctx.arc(-19, 3, 3, -Math.PI / 2, Math.PI / 2, true);
        ctx.moveTo(16, 0);
        ctx.arc(19, 3, 3, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
        break;

      case 'saltShaker':
        // Body
        ctx.moveTo(-9, 16);
        ctx.lineTo(-6, -4);
        ctx.lineTo(6, -4);
        ctx.lineTo(9, 16);
        ctx.closePath();
        // Cap dome
        ctx.moveTo(-6, -4);
        ctx.arc(0, -4, 6, Math.PI, 0);
        // Shaker holes
        ctx.moveTo(-1, -7);
        ctx.arc(-2, -7, 0.8, 0, Math.PI * 2);
        ctx.moveTo(3, -7);
        ctx.arc(2, -7, 0.8, 0, Math.PI * 2);
        ctx.moveTo(1, -9);
        ctx.arc(0, -9, 0.8, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'forkKnife':
        // Fork (Left)
        ctx.moveTo(-8, 20);
        ctx.lineTo(-8, 2);
        ctx.moveTo(-12, 2);
        ctx.lineTo(-12, -14);
        ctx.moveTo(-9.3, 2);
        ctx.lineTo(-9.3, -14);
        ctx.moveTo(-6.6, 2);
        ctx.lineTo(-6.6, -14);
        ctx.moveTo(-4, 2);
        ctx.lineTo(-4, -14);
        ctx.moveTo(-12, 2);
        ctx.arcTo(-8, 7, -4, 2, 4);
        // Knife (Right)
        ctx.moveTo(8, 20);
        ctx.lineTo(8, 2);
        ctx.moveTo(8, 2);
        ctx.lineTo(8, -16);
        ctx.bezierCurveTo(14, -12, 14, -2, 8, 2);
        ctx.stroke();
        break;

      case 'ladle':
        // S-curved handle
        ctx.moveTo(-14, -20);
        ctx.bezierCurveTo(-10, -10, 4, -4, 4, 8);
        // Bowl
        ctx.arc(0, 14, 10, 0, Math.PI);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'cleaver':
        // Handle
        ctx.rect(-18, 5, 12, 6);
        // Heavy blade
        ctx.moveTo(-6, 12);
        ctx.lineTo(-6, -16);
        ctx.lineTo(16, -16);
        ctx.bezierCurveTo(18, -2, 18, 8, 16, 12);
        ctx.closePath();
        // Hole in top corner
        ctx.moveTo(11, -11);
        ctx.arc(9, -11, 2, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
  }

  private updateCurrentTabFromUrl(url: string) {
    const path = url.split('?')[0];
    switch (path) {
      case 'home':
      case 'dashboard':
        this.currentTab.set(Tab.Home);
        break;
      case Tab.Inventory:
        this.currentTab.set(Tab.Inventory);
        break;
      case Tab.Recipes:
        this.currentTab.set(Tab.Recipes);
        break;
      case Tab.ShoppingList:
        this.currentTab.set(Tab.ShoppingList);
        break;
      case Tab.MealPlanner:
        this.currentTab.set(Tab.MealPlanner);
        break;
      default:
        this.currentTab.set(Tab.Home);
    }
  }

  onTabSelected(tab: Tab) {
    this.currentTab.set(tab);
    this.router.navigate([tab]);
  }

  handleLogout() {
    this.authService.logout().subscribe();
  }
}
