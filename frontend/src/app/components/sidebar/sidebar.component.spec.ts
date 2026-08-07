import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let eventsSubject: Subject<RouterEvent>;
  let mockRouter: { navigate: unknown; url: string; events: Subject<RouterEvent> };

  beforeEach(() => {
    eventsSubject = new Subject<RouterEvent>();
    mockRouter = { navigate: vi.fn(), url: '/inventory/items', events: eventsSubject };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });

    component = TestBed.runInInjectionContext(() => new SidebarComponent());
  });

  it('should create sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle collapse state', () => {
    expect(component.isCollapsed()).toBe(false);
    component.toggleCollapse();
    expect(component.isCollapsed()).toBe(true);
  });

  it('should detect active inventory routes correctly', () => {
    expect(component.isInventoryActive()).toBe(true);
    expect(component.isInventoryItemsActive()).toBe(true);
    expect(component.isIngredientsActive()).toBe(false);
  });

  it('should dynamically update active state when starting on /inventory/ingredients and navigating to /inventory/items via NavigationEnd event', () => {
    mockRouter.url = '/inventory/ingredients';
    eventsSubject.next(new NavigationEnd(1, '/inventory/ingredients', '/inventory/ingredients'));

    expect(component.isIngredientsActive()).toBe(true);
    expect(component.isInventoryItemsActive()).toBe(false);

    // Simulate user navigating to /inventory/items
    mockRouter.url = '/inventory/items';
    eventsSubject.next(new NavigationEnd(2, '/inventory/items', '/inventory/items'));

    expect(component.isIngredientsActive()).toBe(false);
    expect(component.isInventoryItemsActive()).toBe(true);
  });

  it('should correctly mark ingredients active on /inventory/ingredients and /inventory/ingredients/new without highlighting items', () => {
    mockRouter.url = '/inventory/ingredients/new';
    eventsSubject.next(
      new NavigationEnd(1, '/inventory/ingredients/new', '/inventory/ingredients/new'),
    );

    expect(component.isIngredientsActive()).toBe(true);
    expect(component.isInventoryItemsActive()).toBe(false);
    expect(component.isInventoryActive()).toBe(true);
  });

  it('should correctly mark ingredient items active on /inventory/items and /inventory/items/new without highlighting ingredients', () => {
    mockRouter.url = '/inventory/items/new';
    eventsSubject.next(new NavigationEnd(1, '/inventory/items/new', '/inventory/items/new'));

    expect(component.isInventoryItemsActive()).toBe(true);
    expect(component.isIngredientsActive()).toBe(false);
    expect(component.isInventoryActive()).toBe(true);
  });

  it('should correctly mark ingredient groups active on /inventory/groups and /inventory/groups/new', () => {
    mockRouter.url = '/inventory/groups/new';
    eventsSubject.next(new NavigationEnd(1, '/inventory/groups/new', '/inventory/groups/new'));

    expect(component.isIngredientGroupsActive()).toBe(true);
    expect(component.isIngredientsActive()).toBe(false);
    expect(component.isInventoryItemsActive()).toBe(false);
  });

  it('should navigate to path and close mobile menu', () => {
    component.mobileMenuOpen.set(true);
    component.navigateTo('/recipes');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipes']);
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should emit themeToggled on toggle', () => {
    const spy = vi.spyOn(component.themeToggled, 'emit');
    component.onToggleTheme();
    expect(spy).toHaveBeenCalled();
  });
});
