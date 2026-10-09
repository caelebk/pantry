import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  DefaultUrlSerializer,
  NavigationEnd,
  Router,
  Event as RouterEvent,
  UrlTree,
} from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { KitchenCreateDialogComponent } from '../kitchen-create-dialog/kitchen-create-dialog.component';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let eventsSubject: Subject<RouterEvent>;
  let mockRouter: {
    navigate: unknown;
    navigateByUrl: unknown;
    createUrlTree: (commands: string[]) => UrlTree;
    serializeUrl: (tree: UrlTree) => string;
    url: string;
    events: Subject<RouterEvent>;
  };

  beforeEach(() => {
    eventsSubject = new Subject<RouterEvent>();
    const serializer = new DefaultUrlSerializer();
    mockRouter = {
      navigate: vi.fn(),
      navigateByUrl: vi.fn(),
      createUrlTree: (commands) => serializer.parse(commands.join('/')),
      serializeUrl: (tree) => serializer.serialize(tree),
      url: '/inventory/items',
      events: eventsSubject,
    };

    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
        }),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });

    component = TestBed.runInInjectionContext(() => new SidebarComponent());
  });

  it('should create sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('renders every destination as a native anchor with a usable href', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    for (const path of [
      '/home',
      '/inventory',
      '/inventory/ingredients',
      '/inventory/items',
      '/inventory/groups',
      '/recipes',
      '/shopping-list',
      '/meal-planner',
      '/profile',
    ]) {
      expect(element.querySelector(`a[href="${path}"]`)).not.toBeNull();
    }
  });

  it('marks only the exact normalized destination as the current page', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    eventsSubject.next(
      new NavigationEnd(
        1,
        '/inventory/items/?status=fresh#list',
        '/inventory/items/?status=fresh#list',
      ),
    );
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(element.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(
      '/inventory/items',
    );
    expect(element.querySelector('a[href="/inventory"]')?.hasAttribute('aria-current')).toBe(false);
    expect(
      element
        .querySelector('a[href="/inventory/items"]')
        ?.classList.contains('sidebar-subnav-active'),
    ).toBe(true);
    eventsSubject.next(new NavigationEnd(2, '/inventory/items/new', '/inventory/items/new'));
    fixture.detectChanges();
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
    expect(
      element
        .querySelector('a[href="/inventory/items"]')
        ?.classList.contains('sidebar-subnav-active'),
    ).toBe(true);
  });

  it.each(['/inventory/ingredients', '/inventory/items', '/inventory/groups'])(
    'preserves the child highlight and exact current page for %s with a query and fragment',
    (path) => {
      const fixture = TestBed.createComponent(SidebarComponent);
      eventsSubject.next(
        new NavigationEnd(1, `${path}?view=table#list`, `${path}?view=table#list`),
      );
      fixture.detectChanges();
      const element = fixture.nativeElement as HTMLElement;
      const link = element.querySelector(`a[href="${path}"]`);
      expect(link?.classList.contains('sidebar-subnav-active')).toBe(true);
      expect(link?.getAttribute('aria-current')).toBe('page');
      expect(element.querySelector('a[href="/inventory"]')?.hasAttribute('aria-current')).toBe(
        false,
      );
      expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    },
  );

  it('closes menus for ordinary link activation and preserves modified clicks', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a[href="/recipes"]',
    );
    expect(link).not.toBeNull();
    sidebar.mobileMenuOpen.set(true);
    sidebar.kitchenMenuOpen.set(true);
    link?.dispatchEvent(
      new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true }),
    );
    expect(sidebar.mobileMenuOpen()).toBe(true);
    expect(sidebar.kitchenMenuOpen()).toBe(true);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    link?.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
    expect(sidebar.mobileMenuOpen()).toBe(false);
    expect(sidebar.kitchenMenuOpen()).toBe(false);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
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

  it('should toggle kitchen menu and close on outside document click', () => {
    expect(component.kitchenMenuOpen()).toBe(false);
    component.toggleKitchenMenu();
    expect(component.kitchenMenuOpen()).toBe(true);

    component.onDocumentClick();
    expect(component.kitchenMenuOpen()).toBe(false);
  });

  it('should select active kitchen and close kitchen menu', () => {
    const mockKitchen = {
      id: 'k-1',
      name: 'Family Kitchen',
      role: 'owner' as const,
      isPrimary: true,
      memberCount: 2,
    };
    const spy = vi.spyOn(component.authService, 'setActiveKitchen');
    component.kitchenMenuOpen.set(true);

    component.selectKitchen(mockKitchen);
    expect(spy).toHaveBeenCalledWith(mockKitchen);
    expect(component.kitchenMenuOpen()).toBe(false);
  });

  it('opens the shared creation dialog from the kitchen switcher', () => {
    component.kitchenMenuOpen.set(true);
    component.openAddKitchenDialog();
    expect(component.kitchenMenuOpen()).toBe(false);
    expect(component.showAddKitchenDialog()).toBe(true);
  });

  it('excludes a closed mobile drawer from focus and exposes destinations after desktop collapse', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    sidebar.isMobile.set(true);
    sidebar.isCollapsed.set(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('aside')?.hasAttribute('inert')).toBe(true);
    sidebar.toggleMobileMenu();
    fixture.detectChanges();
    expect(element.querySelector('aside')?.hasAttribute('inert')).toBe(false);
    expect(element.querySelector('a[href="/inventory/items"]')).not.toBeNull();
  });

  it('moves opening focus into the drawer and returns it on Escape', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    sidebar.isMobile.set(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    const trigger = element.querySelector<HTMLButtonElement>(
      '[aria-controls="pantry-navigation"]',
    )!;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await Promise.resolve();
    expect(element.querySelector('aside')?.contains(document.activeElement)).toBe(true);
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(sidebar.mobileMenuOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    element.remove();
  });

  it('keeps Tab and Shift+Tab inside an open mobile drawer', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    sidebar.isMobile.set(true);
    sidebar.mobileMenuOpen.set(true);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    const controls = element.querySelectorAll<HTMLElement>('aside button, aside a[href]');
    const first = controls[0];
    const last = controls[controls.length - 1];
    last.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    element.remove();
  });

  it('supports arrow and boundary keys in the native kitchen chooser', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    const kitchens = [
      {
        id: 'k-1',
        name: 'A long kitchen workspace name',
        role: 'owner' as const,
        isPrimary: true,
        memberCount: 1,
      },
      {
        id: 'k-2',
        name: 'Another kitchen',
        role: 'editor' as const,
        isPrimary: false,
        memberCount: 8,
      },
    ];
    sidebar.authService.userKitchens.set(kitchens);
    sidebar.authService.activeKitchen.set(kitchens[0]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    const trigger = element.querySelector<HTMLButtonElement>('[aria-controls="pantry-kitchens"]')!;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    await Promise.resolve();
    const options = element.querySelectorAll<HTMLButtonElement>('#pantry-kitchens button');
    expect(document.activeElement).toBe(options[0]);
    expect(options[0].getAttribute('aria-pressed')).toBe('true');
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(options[options.length - 1]);
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(options[1]);
    const select = vi.spyOn(sidebar.authService, 'setActiveKitchen');
    options[1].click();
    expect(select).toHaveBeenCalledWith(kitchens[1]);
    expect(sidebar.kitchenMenuOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    element.remove();
  });

  it('returns creation focus to the mobile trigger after resizing an open desktop dialog', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    sidebar.isMobile.set(false);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    sidebar.openAddKitchenDialog();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = fixture.debugElement.query(By.directive(KitchenCreateDialogComponent))
      .componentInstance as KitchenCreateDialogComponent;
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    sidebar.onResize();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('aside')?.hasAttribute('inert')).toBe(true);
    dialog.visible.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    dialog.restoreFocus();
    const trigger = element.querySelector<HTMLButtonElement>('[aria-controls="pantry-navigation"]');
    expect(document.activeElement).toBe(trigger);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    element.remove();
  });

  it('closes the drawer at desktop breakpoint without changing the collapse preference', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const sidebar = fixture.componentInstance;
    sidebar.isMobile.set(true);
    sidebar.isCollapsed.set(true);
    sidebar.mobileMenuOpen.set(true);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    sidebar.onResize();
    expect(sidebar.mobileMenuOpen()).toBe(false);
    expect(sidebar.isCollapsed()).toBe(true);
    expect(sidebar.isMobile()).toBe(false);
  });

  it('dismisses the kitchen chooser with Escape and restores switcher focus', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
    const trigger = element.querySelector<HTMLButtonElement>('[aria-controls="pantry-kitchens"]')!;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await Promise.resolve();
    const option = element.querySelector<HTMLButtonElement>('#pantry-kitchens button')!;
    option.focus();
    option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.kitchenMenuOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    element.remove();
  });

  it('should render active kitchen name in header when available', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const comp = fixture.componentInstance;
    comp.authService.activeKitchen.set({
      id: 'k-1',
      name: 'Gourmet Studio',
      role: 'owner',
      isPrimary: true,
      memberCount: 3,
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Gourmet Studio');
  });

  it('should display skillet pantry logo in kitchen dropdown list', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const comp = fixture.componentInstance;
    comp.authService.userKitchens.set([
      { id: 'k-1', name: 'Kitchen A', role: 'owner', isPrimary: true, memberCount: 1 },
      { id: 'k-2', name: 'Kitchen B', role: 'editor', isPrimary: false, memberCount: 2 },
    ]);
    comp.kitchenMenuOpen.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const skilletIcons = compiled.querySelectorAll('.material-symbols-outlined');
    const skilletTexts = Array.from(skilletIcons).map((el) => el.textContent?.trim());
    expect(skilletTexts.filter((t) => t === 'skillet').length).toBeGreaterThanOrEqual(3);
  });
});
