import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
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

  Tab = Tab; // Expose enum to template
  title = 'Pantry';
  darkMode = signal(true);
  currentTab = signal<Tab>(Tab.Home);

  private animationFrameId?: number;
  private particles: Particle[] = [];
  private mouse = { x: -1000, y: -1000, radius: 140 };
  private resizeListener?: () => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private mouseLeaveListener?: () => void;

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

    // Sync currentTab with the current route
    this.router.events
      .pipe(
        filter((event: Event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
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
      this.initParticleWeb();
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
      this.renderParticles(ctx, canvas.width, canvas.height);
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

  private renderParticles(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.clearRect(0, 0, width, height);
    const isDark = this.darkMode();

    const maxConnectDistance = 130;
    const maxConnectDistanceSq = maxConnectDistance * maxConnectDistance;

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      // Bounce off screen edges
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Mouse repulsion / push effect
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

      // Draw Particle Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = isDark ? 0.55 : 0.45;
      ctx.fill();

      // Draw Connecting Web Threads between nearby particles
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
}
