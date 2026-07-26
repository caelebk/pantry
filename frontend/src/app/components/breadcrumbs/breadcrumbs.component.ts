import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  queryParams?: Record<string, string>;
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

  private buildBreadcrumbs(rawUrl: string): void {
    const [pathPart] = rawUrl.split('?');
    const cleanUrl = pathPart.split('#')[0];
    const segments = cleanUrl.split('/').filter((s) => s.length > 0);

    const items: BreadcrumbItem[] = [{ label: 'Home', url: '/home', icon: 'pi pi-home' }];

    if (segments.length === 0 || segments[0] === 'home' || segments[0] === 'dashboard') {
      this.breadcrumbs.set(items);
      return;
    }

    const firstSegment = segments[0];

    if (firstSegment === 'inventory') {
      items.push({ label: 'Inventory', url: '/inventory/items', icon: 'pi pi-box' });

      const secondSegment = segments[1];
      const thirdSegment = segments[2];

      if (secondSegment === 'items') {
        if (thirdSegment === 'new') {
          items.push({ label: 'Ingredient Items', url: '/inventory/items', icon: 'pi pi-list' });
          items.push({ label: 'Add New Item', icon: 'pi pi-plus-circle' });
        } else if (segments[3] === 'edit') {
          items.push({ label: 'Ingredient Items', url: '/inventory/items', icon: 'pi pi-list' });
          items.push({ label: 'Edit Item', icon: 'pi pi-pencil' });
        } else {
          items.push({ label: 'Ingredient Items', icon: 'pi pi-list' });
        }
      } else if (secondSegment === 'ingredients') {
        if (thirdSegment === 'new') {
          items.push({
            label: 'Ingredients',
            url: '/inventory/ingredients',
            icon: 'pi pi-sparkles',
          });
          items.push({ label: 'Add Ingredient', icon: 'pi pi-plus-circle' });
        } else if (segments[3] === 'edit') {
          items.push({
            label: 'Ingredients',
            url: '/inventory/ingredients',
            icon: 'pi pi-sparkles',
          });
          items.push({ label: 'Edit Ingredient', icon: 'pi pi-pencil' });
        } else {
          items.push({ label: 'Ingredients', icon: 'pi pi-sparkles' });
        }
      } else if (secondSegment === 'groups') {
        if (thirdSegment === 'new') {
          items.push({
            label: 'Ingredient Categories & Groups',
            url: '/inventory/groups',
            icon: 'pi pi-tags',
          });
          items.push({ label: 'Add Ingredient Group', icon: 'pi pi-plus-circle' });
        } else if (segments[3] === 'edit') {
          items.push({
            label: 'Ingredient Categories & Groups',
            url: '/inventory/groups',
            icon: 'pi pi-tags',
          });
          items.push({ label: 'Edit Ingredient Group', icon: 'pi pi-pencil' });
        } else {
          items.push({ label: 'Ingredient Categories & Groups', icon: 'pi pi-tags' });
        }
      } else if (secondSegment === 'nutrients') {
        items.push({
          label: 'Ingredient Categories & Groups',
          url: '/inventory/groups',
          icon: 'pi pi-tags',
        });
      } else if (secondSegment === 'new') {
        items.push({ label: 'Ingredient Items', url: '/inventory/items', icon: 'pi pi-list' });
        items.push({ label: 'Add New Item', icon: 'pi pi-plus-circle' });
      } else if (thirdSegment === 'edit') {
        items.push({ label: 'Ingredient Items', url: '/inventory/items', icon: 'pi pi-list' });
        items.push({ label: 'Edit Item', icon: 'pi pi-pencil' });
      } else {
        items.push({ label: 'Ingredient Items', icon: 'pi pi-list' });
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
    } else if (firstSegment === 'meal-planner') {
      if (segments[1] === 'new') {
        items.push({ label: 'Meal Planner', url: '/meal-planner', icon: 'pi pi-calendar' });
        items.push({ label: 'Plan a Meal', icon: 'pi pi-plus-circle' });
      } else {
        items.push({ label: 'Meal Planner', icon: 'pi pi-calendar' });
      }
    } else if (firstSegment === 'shopping-list') {
      if (segments[1] === 'new') {
        items.push({ label: 'Shopping List', url: '/shopping-list', icon: 'pi pi-shopping-bag' });
        items.push({ label: 'Add Shopping Item', icon: 'pi pi-plus-circle' });
      } else if (segments[1] === 'restock') {
        items.push({ label: 'Shopping List', url: '/shopping-list', icon: 'pi pi-shopping-bag' });
        items.push({ label: 'Restock Review', icon: 'pi pi-check-circle' });
      } else {
        items.push({ label: 'Shopping List', icon: 'pi pi-shopping-bag' });
      }
    }

    this.breadcrumbs.set(items);
  }
}
