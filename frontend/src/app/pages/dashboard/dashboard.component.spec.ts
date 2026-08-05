import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;

  beforeEach(() => {
    const mockItemService = { getItems: vi.fn().mockReturnValue(of([])) };
    const mockRecipeService = { getAvailableRecipes: vi.fn().mockReturnValue(of([])) };
    const mockLocationService = { getLocations: vi.fn().mockReturnValue(of([])) };
    const mockToastService = { showSuccess: vi.fn() };
    const mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ItemService, useValue: mockItemService },
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    component = TestBed.runInInjectionContext(() => new DashboardComponent());
  });

  it('should create dashboard component', () => {
    expect(component).toBeTruthy();
  });
});
