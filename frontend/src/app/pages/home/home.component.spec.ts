import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  const mockAuthService = {
    activeKitchen: signal<{ id: string; name: string } | null>({ id: 'k1', name: 'Chef Central' }),
  };

  beforeEach(() => {
    const mockItemService = { getItems: vi.fn().mockReturnValue(of([])) };
    const mockRecipeService = { getAvailableRecipes: vi.fn().mockReturnValue(of([])) };
    const mockLocationService = { getLocations: vi.fn().mockReturnValue(of([])) };
    const mockToastService = { showSuccess: vi.fn() };
    const mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ItemService, useValue: mockItemService },
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    component = TestBed.runInInjectionContext(() => new HomeComponent());
  });

  it('should create home component and display active kitchen name', () => {
    expect(component).toBeTruthy();
    expect(component.totalItemsCount()).toBe(0);
    expect(component.kitchenName()).toBe('Chef Central');
  });

  it('should fallback to default kitchen name if active kitchen is null', () => {
    mockAuthService.activeKitchen.set(null);
    expect(component.kitchenName()).toBe('My Kitchen');
  });
});
