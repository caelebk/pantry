import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { IngredientsPageComponent } from './ingredients-page.component';

describe('IngredientsPageComponent', () => {
  let component: IngredientsPageComponent;
  let fixture: ComponentFixture<IngredientsPageComponent>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockIngredient: Ingredient = {
    id: 'ing-101',
    name: 'All-Purpose Flour',
    ingredientGroup: { id: 1, name: 'Baking' },
    defaultUnit: { id: 1, name: 'Grams', shortName: 'g' },
  };

  beforeEach(async () => {
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
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockIngredientService.getIngredients.and.returnValue(of([mockIngredient]));
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockItemService.getItems.and.returnValue(of([]));
    mockAuthService.activeKitchen.and.returnValue({ id: 'kitchen-1', name: 'Home' } as unknown);

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
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientsPageComponent);
    component = fixture.componentInstance;
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  it('should initialize and load ingredients catalog sorted by group', () => {
    expect(component).toBeTruthy();
    expect(component.ingredients().length).toBe(1);
    expect(component.sortBy()).toBe('group');
  });

  it('should toggle row expansion state when clicking row or toggleRowExpansion', () => {
    expect(component.isRowExpanded('ing-101')).toBeFalse();
    component.toggleRowExpansion('ing-101');
    expect(component.isRowExpanded('ing-101')).toBeTrue();
    component.toggleRowExpansion('ing-101');
    expect(component.isRowExpanded('ing-101')).toBeFalse();
  });

  it('should navigate to add item page passing ingredientId query parameter when adding stock item for an ingredient', () => {
    component.onAddStockItemForIngredient(mockIngredient);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items/new'], {
      queryParams: { ingredientId: 'ing-101' },
    });
  });
});
