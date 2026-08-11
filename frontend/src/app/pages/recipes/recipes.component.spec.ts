import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { IngredientService } from '../../services/inventory/ingredient.service';
import { ItemService } from '../../services/inventory/item.service';
import { UnitService } from '../../services/inventory/unit.service';
import { RecipeService } from '../../services/recipe.service';
import { ToastService } from '../../services/toast.service';
import { RecipesComponent } from './recipes.component';

describe('RecipesComponent', () => {
  let component: RecipesComponent;
  let fixture: ComponentFixture<RecipesComponent>;
  let mockRecipeService: unknown;
  let mockItemService: unknown;
  let mockUnitService: unknown;
  let mockIngredientService: unknown;
  let mockToastService: unknown;
  let mockRouter: unknown;

  const mockRecipe: Recipe = {
    id: 'rec-1',
    name: 'Tuscan Chicken',
    description: 'Creamy chicken dish',
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    difficulty: 'Easy',
    ingredients: [],
    steps: [],
  };

  beforeEach(() => {
    mockRecipeService = {
      getRecipes: vi.fn().mockReturnValue(of([mockRecipe])),
      deleteRecipe: vi.fn(),
    };
    mockItemService = { getItems: vi.fn().mockReturnValue(of([])) };
    mockUnitService = { getUnits: vi.fn().mockReturnValue(of([])) };
    mockIngredientService = { getIngredients: vi.fn().mockReturnValue(of([])) };
    mockToastService = { showSuccess: vi.fn(), showError: vi.fn() };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: ItemService, useValue: mockItemService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: { activeKitchen: vi.fn().mockReturnValue('kitchen-1') } },
      ],
    });

    fixture = TestBed.createComponent(RecipesComponent);
    component = fixture.componentInstance;
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  it('should create recipes component and load data', () => {
    expect(component).toBeTruthy();
    expect(component.recipes.length).toBe(1);
    expect(component.recipes[0].name).toBe('Tuscan Chicken');
  });

  it('should filter recipes by search query', () => {
    component.searchQuery = 'Tuscan';
    const filtered = component.filteredRecipes;
    expect(filtered.length).toBe(1);

    component.searchQuery = 'NonExistent';
    const empty = component.filteredRecipes;
    expect(empty.length).toBe(0);
  });
});
