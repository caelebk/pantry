import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IngredientItemDTO } from '@models/items.model';
import { UnitType } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { AuthService } from '../../../core/services/auth.service';
import { IngredientDetailPageComponent } from './ingredient-detail-page.component';
const units = [
  { id: 1, name: 'Gram', shortName: 'g', type: UnitType.Weight, toBaseFactor: 1 },
  { id: 2, name: 'Millilitre', shortName: 'ml', type: UnitType.Volume, toBaseFactor: 1 },
];
const dto = (id: string, quantity: number, unitId = 1): IngredientItemDTO => ({
  id,
  quantity,
  unitId,
  ingredientId: 'rice',
  label: id,
  locationId: 1,
  purchaseDate: '2026-01-01',
});
describe('IngredientDetailPageComponent', () => {
  let fixture: ComponentFixture<IngredientDetailPageComponent>;
  let component: IngredientDetailPageComponent;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let kitchen: ReturnType<typeof signal<{ id: string } | null>>;
  let ingredients: {
    getIngredientById: ReturnType<typeof vi.fn>;
    getItemsByIngredientId: ReturnType<typeof vi.fn>;
  };
  let itemService: { removeIngredientItem: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({ id: 'rice' }));
    kitchen = signal<{ id: string } | null>({ id: 'kitchen-one' });
    ingredients = {
      getIngredientById: vi.fn(() => of({ id: 'rice', name: 'Rice', defaultUnit: units[0] })),
      getItemsByIngredientId: vi.fn(() =>
        of([dto('bag', 250), dto('jar', 500), dto('liquid', 100, 2), dto('empty', 0)]),
      ),
    };
    itemService = { removeIngredientItem: vi.fn(() => of(undefined)) };
    await TestBed.configureTestingModule({
      imports: [
        IngredientDetailPageComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: params, snapshot: { paramMap: params.value } },
        },
        { provide: AuthService, useValue: { activeKitchen: kitchen } },
        { provide: IngredientService, useValue: ingredients },
        { provide: UnitService, useValue: { getUnits: () => of(units) } },
        {
          provide: LocationService,
          useValue: { getLocations: () => of([{ id: 1, name: 'Pantry' }]) },
        },
        { provide: ItemService, useValue: itemService },
        { provide: ToastService, useValue: { showSuccess: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(IngredientDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => vi.restoreAllMocks());
  it('opens detail at the top of the shell scroll container', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(IngredientDetailPageComponent);
    const scrollContainer = document.createElement('div');
    const main = document.createElement('main');
    scrollContainer.appendChild(main);
    main.appendChild(fixture.nativeElement);
    scrollContainer.scrollTop = 420;
    fixture.detectChanges();
    expect(scrollContainer.scrollTop).toBe(0);
    scrollContainer.scrollTop = 280;
    params.next(convertToParamMap({ id: 'flour' }));
    fixture.detectChanges();
    expect(scrollContainer.scrollTop).toBe(0);
  });

  it('loads selected items and keeps incompatible unit totals separate', () => {
    expect(ingredients.getItemsByIngredientId).toHaveBeenCalledWith('rice');
    expect(component.stock()).toEqual([
      { quantity: 750, unit: 'g' },
      { quantity: 100, unit: 'ml' },
    ]);
    expect(component.state()).toBe('ready');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Rice');
    expect(fixture.nativeElement.querySelector('a[href*="items/new"]').href).toContain(
      'ingredientId=rice',
    );
  });
  it('cancels old requests and clears data when the kitchen changes', () => {
    const pending = new Subject<IngredientItemDTO[]>();
    ingredients.getItemsByIngredientId.mockReturnValue(pending);
    component.retry();
    fixture.detectChanges();
    expect(pending.observed).toBe(true);
    kitchen.set(null);
    fixture.detectChanges();
    expect(pending.observed).toBe(false);
    expect(component.items()).toEqual([]);
    expect(component.state()).toBe('no-kitchen');
  });
  it('reloads on route changes with the new editor return path', () => {
    params.next(convertToParamMap({ id: 'flour' }));
    fixture.detectChanges();
    expect(ingredients.getIngredientById).toHaveBeenCalledWith('flour');
    expect(component.returnParams()).toEqual({ returnTo: '/inventory/ingredients/flour' });
  });
  it('distinguishes not found from retryable failure', () => {
    ingredients.getIngredientById.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    component.retry();
    fixture.detectChanges();
    expect(component.state()).toBe('not-found');
    ingredients.getIngredientById.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    component.retry();
    fixture.detectChanges();
    expect(component.state()).toBe('error');
  });
  it('shows empty state when the ingredient has no items', () => {
    ingredients.getItemsByIngredientId.mockReturnValue(of([]));
    component.retry();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No ingredient items yet');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });
  it('blocks duplicate deletion and retains the item after failure', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deletion = new Subject<void>();
    itemService.removeIngredientItem.mockReturnValue(deletion);
    const item = component.items()[0];
    component.deleteItem(item);
    component.deleteItem(item);
    expect(itemService.removeIngredientItem).toHaveBeenCalledTimes(1);
    deletion.error(new Error('Failed'));
    expect(component.items()).toContain(item);
    expect(component.deleteError()).toBe(true);
    expect(component.deletingId()).toBeNull();
  });
});
