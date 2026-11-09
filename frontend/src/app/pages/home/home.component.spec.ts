import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { ConfirmDialogService } from '@ui';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let mockItemService: { getItems: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  const mockAuthService = {
    activeKitchen: signal<{ id: string; name: string } | null>({ id: 'k1', name: 'Chef Central' }),
  };

  beforeEach(() => {
    mockAuthService.activeKitchen.set({ id: 'k1', name: 'Chef Central' });
    mockItemService = { getItems: vi.fn().mockReturnValue(of([])) };
    const mockRecipeService = { getAvailableRecipes: vi.fn().mockReturnValue(of([])) };
    const mockLocationService = { getLocations: vi.fn().mockReturnValue(of([])) };
    const mockToastService = { showSuccess: vi.fn() };
    mockRouter = { navigate: vi.fn() };

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
        provideTransloco({ config: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
    });
    TestBed.inject(TranslocoService).setTranslation(
      {
        home: {
          myKitchen: 'My kitchen',
          removeConfirm: { title: 'Remove item', message: 'Remove "{{ name }}" from inventory?' },
        },
      },
      'en',
    );

    component = TestBed.runInInjectionContext(() => new HomeComponent());
  });

  it('should create home component and display active kitchen name', () => {
    expect(component).toBeTruthy();
    expect(component.totalItemsCount()).toBe(0);
    expect(component.kitchenName()).toBe('Chef Central');
  });

  it('should fallback to default kitchen name if active kitchen is null', () => {
    mockAuthService.activeKitchen.set(null);
    expect(component.kitchenName()).toBe('My kitchen');
  });

  it('distinguishes load failure from a first-use kitchen and supports retry', () => {
    mockItemService.getItems.mockReturnValue(throwError(() => new Error('offline')));
    component.fetchData();
    expect(component.loadFailed()).toBe(true);
    expect(component.isLoading()).toBe(false);
    mockItemService.getItems.mockReturnValue(of([]));
    component.fetchData();
    expect(component.loadFailed()).toBe(false);
    expect(component.totalItemsCount()).toBe(0);
  });

  it('removes an item only after the confirm dialog resolves true', async () => {
    const confirmDialog = TestBed.inject(ConfirmDialogService);
    const confirmSpy = vi.spyOn(confirmDialog, 'confirm');
    mockItemService.removeItem = vi.fn().mockReturnValue(of(undefined));
    const target = { id: 'a', name: 'Milk' } as Item;

    confirmSpy.mockResolvedValueOnce(false);
    await component.onRemoveItem(target);
    expect(mockItemService.removeItem).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce(true);
    await component.onRemoveItem(target);
    expect(confirmSpy).toHaveBeenLastCalledWith(expect.objectContaining({ destructive: true }));
    expect(mockItemService.removeItem).toHaveBeenCalledWith(target);
  });

  it('uses the canonical stock routes', () => {
    component.onNavigateToAddItem();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items/new']);
    component.onNavigateToInventory();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items']);
  });

  it('moves focus to the expiry review target with reduced-motion support', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const target = document.createElement('section');
    target.id = 'expired-items-section';
    target.tabIndex = -1;
    target.scrollIntoView = vi.fn();
    document.body.append(target);
    component.onReviewExpired();
    expect(document.activeElement).toBe(target);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    target.remove();
    vi.unstubAllGlobals();
  });
  it('limits the Home attention window to seven days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
    mockItemService.getItems.mockReturnValue(
      of([
        { id: 'soon', expirationDate: new Date('2026-10-09T12:00:00Z') },
        { id: 'later', expirationDate: new Date('2026-10-13T12:00:00Z') },
      ] as Item[]),
    );
    component.fetchData();
    expect(component.soonToExpireItems().map((item) => item.id)).toEqual(['soon']);
    vi.useRealTimers();
  });
});
