import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { Tab } from './core/models/tab.model';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

import { ConfirmDialogComponent } from '@ui';
import { routeTransition } from '@utility/animationUtility/animations';

@Component({
  selector: 'pantry-root',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    SidebarComponent,
    RouterOutlet,
    ToastContainerComponent,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
  ],
  animations: [routeTransition],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  readonly mobileNavigationOpen = signal(false);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  Tab = Tab; // Expose enum to template
  title = 'Pantry';
  darkMode = this.themeService.darkMode;
  currentTab = signal<Tab>(Tab.Home);
  isAuthRoute = signal(false);
  // Angular animations ignore prefers-reduced-motion, so the shell disables them itself.
  reducedMotion = signal(false);

  prepareRoute(outlet: RouterOutlet): string {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation']
      ? outlet.activatedRouteData['animation']
      : '';
  }

  constructor() {
    effect(
      () => {
        const user = this.authService.currentUser();
        if (user && user.themePreference) {
          this.themeService.syncFromUserPreference(user.themePreference);
        }
      },
      { allowSignalWrites: true },
    );
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  ngOnInit() {
    this.themeService.apply(this.themeService.darkMode());
    this.watchReducedMotion();

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

  private watchReducedMotion() {
    if (!isPlatformBrowser(this.platformId) || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => this.reducedMotion.set(query.matches);
    sync();
    query.addEventListener('change', sync);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', sync));
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
