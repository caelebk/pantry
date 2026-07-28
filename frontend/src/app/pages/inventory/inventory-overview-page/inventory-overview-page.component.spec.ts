import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { of } from 'rxjs';
import { InventoryOverviewPageComponent } from './inventory-overview-page.component';

describe('InventoryOverviewPageComponent', () => {
  let component: InventoryOverviewPageComponent;
  let fixture: ComponentFixture<InventoryOverviewPageComponent>;

  const mockCategoryService = {
    getIngredientCategories: () => of([]),
  };

  const mockGroupService = {
    getIngredientGroups: () => of([]),
  };

  const mockIngredientService = {
    getIngredients: () => of([]),
  };

  const mockItemService = {
    getItems: () => of([]),
  };

  const mockLocationService = {
    getLocations: () => of([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InventoryOverviewPageComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IngredientCategoryService, useValue: mockCategoryService },
        { provide: IngredientGroupService, useValue: mockGroupService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: ItemService, useValue: mockItemService },
        { provide: LocationService, useValue: mockLocationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryOverviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the InventoryOverviewPageComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should compute metrics correctly when initialized', () => {
    expect(component.categoriesCount()).toBe(0);
    expect(component.groupsCount()).toBe(0);
    expect(component.ingredientsCount()).toBe(0);
    expect(component.itemsCount()).toBe(0);
  });
});
