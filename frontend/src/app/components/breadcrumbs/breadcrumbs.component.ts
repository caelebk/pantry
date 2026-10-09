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
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
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
  imports: [CommonModule, RouterLink, TranslocoModule],
  templateUrl: './breadcrumbs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  public breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit(): void {
    this.buildBreadcrumbs(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: NavigationEnd) => {
        this.buildBreadcrumbs(event.urlAfterRedirects || event.url);
      });
  }

  private buildBreadcrumbs(rawUrl: string): void {
    const segments = rawUrl.split(/[?#]/)[0].split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'nav.home', url: '/home' }];
    const add = (label: string, url?: string) => items.push({ label, url });
    const [section, collection, entity, action] = segments;

    if (!section || section === 'home' || section === 'dashboard') {
      items[0].url = undefined;
    } else if (section === 'profile') {
      add('nav.profile');
    } else if (section === 'inventory') {
      add('nav.inventory', collection ? '/inventory' : undefined);
      const collections: Record<
        string,
        { label: string; path: string; create: string; edit: string }
      > = {
        items: {
          label: 'sidebar.ingredientItems',
          path: '/inventory/items',
          create: 'breadcrumbs.addItem',
          edit: 'breadcrumbs.editItem',
        },
        ingredients: {
          label: 'sidebar.ingredients',
          path: '/inventory/ingredients',
          create: 'breadcrumbs.addIngredient',
          edit: 'breadcrumbs.editIngredient',
        },
        groups: {
          label: 'sidebar.ingredientCategoriesAndGroups',
          path: '/inventory/groups',
          create: 'breadcrumbs.addGroup',
          edit: 'breadcrumbs.editGroup',
        },
      };
      const config = collections[collection];
      if (config) {
        add(config.label, entity ? config.path : undefined);
        if (entity === 'new') add(config.create);
        else if (action === 'edit') add(config.edit);
        else if (action === 'unit-reconciliation') add('breadcrumbs.reconciliation');
        else if (collection === 'ingredients' && entity) add('ingredientDetail.title');
      }
    } else if (section === 'recipes') {
      add('nav.recipes', collection ? '/recipes' : undefined);
      if (collection === 'new') add('breadcrumbs.addRecipe');
      else if (collection) {
        add('breadcrumbs.recipeDetails', entity === 'edit' ? `/recipes/${collection}` : undefined);
        if (entity === 'edit') add('breadcrumbs.editRecipe');
      }
    } else if (section === 'meal-planner') {
      add('nav.mealPlanner', collection ? '/meal-planner' : undefined);
      if (collection === 'new') add('breadcrumbs.planMeal');
    } else if (section === 'shopping-list') {
      add('nav.shoppingList', collection ? '/shopping-list' : undefined);
      if (collection === 'new') add('breadcrumbs.addShoppingItem');
      else if (collection === 'stores') add('breadcrumbs.stores');
      else if (collection === 'restock') add('breadcrumbs.restock');
      else if (entity === 'edit') add('breadcrumbs.editShoppingItem');
    } else if (section === 'design-system') {
      add('breadcrumbs.designSystem');
    }
    this.breadcrumbs.set(items);
  }
}
