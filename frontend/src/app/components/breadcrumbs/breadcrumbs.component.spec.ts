import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { BreadcrumbsComponent } from './breadcrumbs.component';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let events: Subject<NavigationEnd>;
  beforeEach(() => {
    events = new Subject<NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/home', events } }],
    });
    component = TestBed.runInInjectionContext(() => new BreadcrumbsComponent());
    component.ngOnInit();
  });
  it.each([
    ['/profile', 'nav.profile'],
    ['/shopping-list/stores', 'breadcrumbs.stores'],
    ['/shopping-list/s1/edit?tab=test#section', 'breadcrumbs.editShoppingItem'],
    ['/inventory/ingredients/i1/unit-reconciliation', 'breadcrumbs.reconciliation'],
    ['/inventory/ingredients/i1', 'ingredientDetail.title'],
    ['/inventory/items/new', 'breadcrumbs.addItem'],
    ['/inventory/groups/g1/edit', 'breadcrumbs.editGroup'],
    ['/recipes/r1', 'breadcrumbs.recipeDetails'],
    ['/recipes/r1/edit', 'breadcrumbs.editRecipe'],
    ['/meal-planner/new', 'breadcrumbs.planMeal'],
  ])('identifies current route %s', (url, label) => {
    events.next(new NavigationEnd(1, url, url));
    expect(component.breadcrumbs().at(-1)?.label).toBe(label);
    expect(component.breadcrumbs().at(-1)?.url).toBeUndefined();
    expect(component.breadcrumbs()[0].label).toBe('nav.home');
  });
  it('preserves canonical parent destinations for reconciliation and recipe edit', () => {
    events.next(
      new NavigationEnd(
        1,
        '/inventory/ingredients/i1/unit-reconciliation',
        '/inventory/ingredients/i1/unit-reconciliation',
      ),
    );
    expect(
      component
        .breadcrumbs()
        .slice(0, -1)
        .map((item) => item.url),
    ).toEqual(['/home', '/inventory', '/inventory/ingredients']);
    events.next(new NavigationEnd(2, '/recipes/r1/edit', '/recipes/r1/edit'));
    expect(
      component
        .breadcrumbs()
        .slice(0, -1)
        .map((item) => item.url),
    ).toEqual(['/home', '/recipes', '/recipes/r1']);
  });
});
