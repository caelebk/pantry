import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { ToastService } from '@services/toast.service';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { IngredientCatalogStateService } from './ingredient-catalog-state.service';
import { IngredientsPageComponent } from './ingredients-page.component';

describe('IngredientsPageComponent', () => {
  let component: IngredientsPageComponent;
  let fixture: ComponentFixture<IngredientsPageComponent>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const kitchen = signal({ id: 'kitchen-1', name: 'Home' });

  const mockIngredient: Ingredient = {
    id: 'ing-101',
    name: 'All-Purpose Flour',
    ingredientGroup: { id: 1, name: 'Baking' },
    defaultUnit: { id: 1, name: 'Grams', shortName: 'g' },
  };

  beforeEach(async () => {
    queryParams = new BehaviorSubject(convertToParamMap({}));
    kitchen.set({ id: 'kitchen-1', name: 'Home' });
    mockIngredientService = jasmine.createSpyObj('IngredientService', [
      'getIngredients',
      'deleteIngredient',
    ]);
    mockIngredientGroupService = jasmine.createSpyObj('IngredientGroupService', [
      'getIngredientGroups',
    ]);
    mockItemService = jasmine.createSpyObj('ItemService', ['getItems', 'removeItem']);
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['activeKitchen']);

    mockIngredientService.getIngredients.and.returnValue(of([mockIngredient]));
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockItemService.getItems.and.returnValue(of([]));
    mockAuthService.activeKitchen.and.callFake(() => kitchen() as unknown);

    await TestBed.configureTestingModule({
      imports: [
        IngredientsPageComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: IngredientGroupService, useValue: mockIngredientGroupService },
        { provide: ItemService, useValue: mockItemService },
        { provide: ToastService, useValue: mockToastService },
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load ingredients catalog sorted by group', () => {
    expect(component).toBeTruthy();
    expect(component.ingredients().length).toBe(1);
    expect(component.sortBy()).toBe('group');
  });

  it('opens a dedicated page from the ingredient link without nesting tables', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('tbody a');
    expect(link.getAttribute('href')).toBe('/inventory/ingredients/ing-101');
    expect(fixture.nativeElement.querySelectorAll('table').length).toBe(1);
  });

  it('retains catalog filters and sorting when returning from another page', () => {
    component.onSearchChange('Flour');
    component.setStatusFilter('out-of-stock');
    component.toggleSort('name');
    component.pageSize.set(30);
    fixture.destroy();
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.searchQuery()).toBe('Flour');
    expect(component.selectedStatusFilter()).toBe('out-of-stock');
    expect(component.sortBy()).toBe('name');
    expect(component.pageSize()).toBe(30);
    expect(component.displayedIngredients().map((ingredient) => ingredient.id)).toEqual([
      'ing-101',
    ]);
  });

  it('does not reuse another kitchen catalog filters', () => {
    component.onSearchChange('Flour');
    fixture.destroy();
    mockAuthService.activeKitchen.and.returnValue({ id: 'kitchen-2', name: 'Other' } as unknown);
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.searchQuery()).toBe('');
    expect(TestBed.inject(IngredientCatalogStateService).views.get('kitchen-1')?.search).toBe(
      'Flour',
    );
  });
  it('applies a group link after async loading and clears stale saved filters', () => {
    component.onSearchChange('hidden');
    component.setStatusFilter('in-stock');
    component.currentPage.set(8);
    fixture.destroy();
    const groups = new Subject<[{ id: number; name: string }]>();
    mockIngredientGroupService.getIngredientGroups.and.returnValue(groups);
    queryParams.next(convertToParamMap({ groupId: '1', from: 'groups' }));
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isLoading()).toBe(true);
    groups.next([{ id: 1, name: 'Baking' }]);
    groups.complete();
    fixture.detectChanges();
    expect(component.selectedGroup()?.id).toBe(1);
    expect(component.searchQuery()).toBe('');
    expect(component.selectedStatusFilter()).toBe('all');
    expect(component.currentPage()).toBe(1);
    expect(component.displayedIngredients().map((ingredient) => ingredient.id)).toEqual([
      'ing-101',
    ]);
    expect(fixture.nativeElement.querySelector('a[href="/inventory/groups"]')).toBeTruthy();
  });

  it('responds to group query changes without recreating the catalog', () => {
    component.ingredientGroups.set([
      { id: 1, name: 'Baking' },
      { id: 2, name: 'Fruit' },
    ]);
    queryParams.next(convertToParamMap({ groupId: '1', from: 'groups' }));
    fixture.detectChanges();
    expect(component.selectedGroup()?.id).toBe(1);
    component.onSearchChange('hidden');
    queryParams.next(convertToParamMap({ groupId: '2', from: 'groups' }));
    fixture.detectChanges();
    expect(component.selectedGroup()?.id).toBe(2);
    expect(component.searchQuery()).toBe('');
    expect(component.filteredIngredients()).toEqual([]);
  });

  it('resolves the linked group against the active kitchen on kitchen changes', () => {
    component.ingredientGroups.set([{ id: 1, name: 'Baking' }]);
    queryParams.next(convertToParamMap({ groupId: '1', from: 'groups' }));
    fixture.detectChanges();
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    kitchen.set({ id: 'kitchen-2', name: 'Other' });
    fixture.detectChanges();
    expect(component.selectedGroup()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });

  for (const groupId of [undefined, 'nope', '0', '-1', '1.5', '9007199254740992', '99']) {
    it(`clears stale filters and explains unavailable group ${groupId}`, () => {
      component.onSearchChange('hidden');
      component.onGroupChange({ id: 3, name: 'Stale' });
      queryParams.next(
        convertToParamMap({ ...(groupId === undefined ? {} : { groupId }), from: 'groups' }),
      );
      fixture.detectChanges();
      expect(component.selectedGroup()).toBeNull();
      expect(component.searchQuery()).toBe('');
      expect(component.filteredIngredients()).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    });
  }

  it('retains the group catalog context when returning from ingredient detail without retaining back link', () => {
    component.ingredientGroups.set([{ id: 1, name: 'Baking' }]);
    queryParams.next(convertToParamMap({ groupId: '1', from: 'groups' }));
    fixture.detectChanges();
    component.onSearchChange('Flour');
    fixture.destroy();
    queryParams.next(convertToParamMap({}));
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.selectedGroup()?.id).toBe(1);
    expect(component.searchQuery()).toBe('Flour');
    expect(component.fromGroups()).toBe(false);
    expect(fixture.nativeElement.querySelector('a[href="/inventory/groups"]')).toBeNull();
  });

  it('does not display back to categories & groups navigation when navigating directly to ingredients', () => {
    queryParams.next(convertToParamMap({}));
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.fromGroups()).toBe(false);
    expect(fixture.nativeElement.querySelector('a[href="/inventory/groups"]')).toBeNull();
  });

  it('does not persist back to categories & groups navigation after navigating to ingredients without from=groups', () => {
    component.ingredientGroups.set([{ id: 1, name: 'Baking' }]);
    queryParams.next(convertToParamMap({ groupId: '1', from: 'groups' }));
    fixture.detectChanges();
    expect(component.fromGroups()).toBe(true);
    expect(fixture.nativeElement.querySelector('a[href="/inventory/groups"]')).toBeTruthy();

    fixture.destroy();
    queryParams.next(convertToParamMap({}));
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.fromGroups()).toBe(false);
    expect(fixture.nativeElement.querySelector('a[href="/inventory/groups"]')).toBeNull();
  });

  it('preserves edited filters when browser Back returns to the linked catalog', () => {
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([{ id: 1, name: 'Baking' }]));
    queryParams.next(convertToParamMap({ groupId: '1', from: 'groups' }));
    fixture.detectChanges();
    component.onSearchChange('Flour');
    component.setStatusFilter('out-of-stock');
    fixture.destroy();
    vi.spyOn(TestBed.inject(Router), 'getCurrentNavigation').mockReturnValue({
      trigger: 'popstate',
    } as never);
    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.searchQuery()).toBe('Flour');
    expect(component.selectedStatusFilter()).toBe('out-of-stock');
    expect(component.fromGroups()).toBe(true);
  });
});
