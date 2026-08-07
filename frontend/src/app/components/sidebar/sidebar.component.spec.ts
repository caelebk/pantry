import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let mockRouter: { navigate: unknown; url: string };

  beforeEach(() => {
    mockRouter = { navigate: vi.fn(), url: '/inventory/items' };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });

    component = TestBed.runInInjectionContext(() => new SidebarComponent());
  });

  it('should create sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle collapse state', () => {
    expect(component.isCollapsed).toBeFalse();
    component.toggleCollapse();
    expect(component.isCollapsed).toBeTrue();
  });

  it('should detect active inventory routes', () => {
    expect(component.isInventoryActive()).toBeTrue();
    expect(component.isInventoryItemsActive()).toBeTrue();
  });

  it('should navigate to path and close mobile menu', () => {
    component.mobileMenuOpen = true;
    component.navigateTo('/recipes');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipes']);
    expect(component.mobileMenuOpen).toBeFalse();
  });

  it('should emit themeToggled on toggle', () => {
    const spy = vi.spyOn(component.themeToggled, 'emit');
    component.onToggleTheme();
    expect(spy).toHaveBeenCalled();
  });
});
