import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { Tab } from './components/tabs/tabs.model';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

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
export class AppComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  Tab = Tab; // Expose enum to template
  title = 'Pantry';
  darkMode = signal(true);
  currentTab = signal<Tab>(Tab.Home);

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
