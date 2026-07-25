import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

@Component({
  selector: 'pantry-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumbs.component.html',
})
export class BreadcrumbsComponent implements OnInit {
  private readonly router = inject(Router);
  public breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit(): void {
    this.buildBreadcrumbs(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.buildBreadcrumbs(event.urlAfterRedirects || event.url);
      });
  }

  private buildBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter((s) => s.length > 0);

    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', url: '/dashboard', icon: 'pi pi-home' },
    ];

    if (segments.length === 0 || segments[0] === 'dashboard') {
      this.breadcrumbs.set(items);
      return;
    }

    const firstSegment = segments[0];

    if (firstSegment === 'inventory') {
      items.push({ label: 'Inventory', url: '/inventory', icon: 'pi pi-box' });

      if (segments[1] === 'new') {
        items.push({ label: 'Add New Item', icon: 'pi pi-plus-circle' });
      }
    } else if (firstSegment === 'recipes') {
      items.push({ label: 'Recipes', url: '/recipes', icon: 'pi pi-book' });

      if (segments[1] === 'new') {
        items.push({ label: 'Add New Recipe', icon: 'pi pi-plus-circle' });
      } else if (segments[1]) {
        const recipeId = segments[1];
        if (segments[2] === 'edit') {
          items.push({ label: 'Recipe Details', url: `/recipes/${recipeId}` });
          items.push({ label: 'Edit Recipe', icon: 'pi pi-pencil' });
        } else {
          items.push({ label: 'Recipe Details', icon: 'pi pi-align-left' });
        }
      }
    }

    this.breadcrumbs.set(items);
  }
}
