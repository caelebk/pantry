import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { Tab } from './components/tabs/tabs.model';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'pantry-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterOutlet, ToastContainerComponent, BreadcrumbsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private routerSubscription?: Subscription;

  Tab = Tab; // Expose enum to template
  title = 'Pantry';
  darkMode = true;
  currentTab: Tab = Tab.Dashboard;

  toggleTheme() {
    this.darkMode = !this.darkMode;
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  ngOnInit() {
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }

    // Sync currentTab with the current route
    this.routerSubscription = this.router.events
      .pipe(filter((event: Event) => event instanceof NavigationEnd))
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

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  private updateCurrentTabFromUrl(url: string) {
    const path = url.split('?')[0];
    switch (path) {
      case Tab.Dashboard:
        this.currentTab = Tab.Dashboard;
        break;
      case Tab.Inventory:
        this.currentTab = Tab.Inventory;
        break;
      case Tab.Recipes:
        this.currentTab = Tab.Recipes;
        break;
      default:
        this.currentTab = Tab.Dashboard;
    }
  }

  onTabSelected(tab: Tab) {
    this.currentTab = tab;
    this.router.navigate([tab]);
  }
}
