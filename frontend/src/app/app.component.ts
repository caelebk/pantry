import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet, Event } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { Tab } from './components/tabs/tabs.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterOutlet],
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
    this.routerSubscription = this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
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
      case Tab.MealPlanner:
        this.currentTab = Tab.MealPlanner;
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
