import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitType } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { AddRecipeFormComponent } from './add-recipe-form.component';

describe('AddRecipeFormComponent', () => {
  let component: AddRecipeFormComponent;
  let fixture: ComponentFixture<AddRecipeFormComponent>;
  let mockRecipeService: jasmine.SpyObj<RecipeService>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUnitGrams = {
    id: 1,
    name: 'Grams',
    shortName: 'g',
    type: UnitType.Weight,
    toBaseFactor: 1,
  };

  const mockUnitTbsp = {
    id: 2,
    name: 'Tablespoons',
    shortName: 'tbsp',
    type: UnitType.Volume,
    toBaseFactor: 15,
  };

  const mockIngredient = {
    id: 'ing-1',
    name: 'Olive Oil',
    defaultUnit: mockUnitTbsp,
  };

  beforeEach(async () => {
    mockRecipeService = jasmine.createSpyObj('RecipeService', [
      'getRecipeById',
      'createRecipe',
      'updateRecipe',
    ]);
    mockIngredientService = jasmine.createSpyObj('IngredientService', [
      'getIngredients',
      'createIngredient',
    ]);
    mockIngredientGroupService = jasmine.createSpyObj('IngredientGroupService', [
      'getIngredientGroups',
    ]);
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockRecipeService.createRecipe.and.returnValue(
      of({
        id: 'recipe-1',
        name: 'Test Recipe',
      }),
    );
    mockIngredientService.getIngredients.and.returnValue(of([mockIngredient]));
    mockIngredientService.createIngredient.and.returnValue(
      of({
        id: 'ing-2',
        name: 'Garlic',
        defaultUnitId: 1,
      }),
    );
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockUnitService.getUnits.and.returnValue(of([mockUnitGrams, mockUnitTbsp]));

    await TestBed.configureTestingModule({
      imports: [AddRecipeFormComponent],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: IngredientGroupService, useValue: mockIngredientGroupService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddRecipeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize available ingredients, groups, and units', () => {
    expect(component).toBeTruthy();
    expect(component.availableIngredients.length).toBe(1);
    expect(component.availableUnits.length).toBe(2);
  });

  it('should lock unit to the default unit of the selected ingredient and auto-append next empty row', () => {
    component.recipeIngredients = [];
    component.addIngredientRow();
    const row = component.recipeIngredients[0];

    component.selectIngredient(row, mockIngredient);
    expect(row.ingredientId).toBe('ing-1');
    expect(row.unitId).toBe(mockUnitTbsp.id);
    expect(component.recipeIngredients.length).toBe(2);
  });

  it('should close ingredient dropdown when clicking outside or pressing Escape key', () => {
    component.recipeIngredients = [];
    component.addIngredientRow();
    const row = component.recipeIngredients[0];
    row.dropdownOpen = true;

    const dummyOutsideElement = document.createElement('div');
    component.onDocumentClick({ target: dummyOutsideElement } as unknown as MouseEvent);
    expect(row.dropdownOpen).toBeFalse();

    row.dropdownOpen = true;
    component.onEscapeKey();
    expect(row.dropdownOpen).toBeFalse();
  });

  it('should reorder ingredients up and down correctly', () => {
    component.recipeIngredients = [
      { ingredientId: 'ing-1', quantity: 1, unitId: 1, searchFilter: 'Salt', dropdownOpen: false },
      { ingredientId: 'ing-2', quantity: 2, unitId: 2, searchFilter: 'Pepper', dropdownOpen: false },
    ];

    component.moveIngredientDown(0);
    expect(component.recipeIngredients[0].searchFilter).toBe('Pepper');
    expect(component.recipeIngredients[1].searchFilter).toBe('Salt');

    component.moveIngredientUp(1);
    expect(component.recipeIngredients[0].searchFilter).toBe('Salt');
    expect(component.recipeIngredients[1].searchFilter).toBe('Pepper');
  });

  it('should support drag and drop reordering for ingredients and steps', () => {
    component.recipeIngredients = [
      { id: '1', ingredientId: 'ing-1', quantity: 1, unitId: 1, searchFilter: 'Salt', dropdownOpen: false },
      { id: '2', ingredientId: 'ing-2', quantity: 2, unitId: 2, searchFilter: 'Pepper', dropdownOpen: false },
    ];

    const mockDragEvent = { preventDefault: () => {}, dataTransfer: { setData: () => {}, effectAllowed: '', dropEffect: '' } } as unknown as DragEvent;

    component.onIngredientDragStart(mockDragEvent, 0);
    expect(component.draggedIngredientIndex).toBe(0);

    component.onIngredientDrop(mockDragEvent, 1);
    expect(component.recipeIngredients[0].searchFilter).toBe('Pepper');
    expect(component.recipeIngredients[1].searchFilter).toBe('Salt');
    expect(component.draggedIngredientIndex).toBeNull();

    component.recipeSteps = [
      { id: 'step-1', instructionText: 'Step 1: Chop onions', timerSeconds: null },
      { id: 'step-2', instructionText: 'Step 2: Saute in oil', timerSeconds: 300 },
    ];

    component.onStepDragStart(mockDragEvent, 0);
    expect(component.draggedStepIndex).toBe(0);

    component.onStepDrop(mockDragEvent, 1);
    expect(component.recipeSteps[0].instructionText).toBe('Step 2: Saute in oil');
    expect(component.recipeSteps[1].instructionText).toBe('Step 1: Chop onions');
    expect(component.draggedStepIndex).toBeNull();
  });

  it('should open quick create ingredient dialog and create a new ingredient with customizable default unit', () => {
    component.recipeIngredients = [];
    component.addIngredientRow();
    component.recipeIngredients[0].searchFilter = 'Garlic';

    component.openQuickCreateIngredient(0);
    expect(component.displayQuickCreateDialog()).toBeTrue();
    expect(component.newIngredientName()).toBe('Garlic');

    component.newIngredientDefaultUnit.set(mockUnitGrams);
    component.submitQuickCreateIngredient();

    expect(mockIngredientService.createIngredient).toHaveBeenCalledWith({
      name: 'Garlic',
      ingredientGroupId: undefined,
      defaultUnitId: mockUnitGrams.id,
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(component.displayQuickCreateDialog()).toBeFalse();
  });

  it('should validate and save recipe with custom ingredient units', () => {
    component.name = 'Tuscan Chicken';
    component.servings = 4;
    component.prepTime = 10;
    component.cookTime = 20;
    component.recipeIngredients = [
      {
        ingredientId: 'ing-1',
        quantity: 2,
        unitId: mockUnitTbsp.id,
        searchFilter: 'Olive Oil',
        dropdownOpen: false,
      },
    ];
    component.recipeSteps = [{ instructionText: 'Cook chicken in oil', timerSeconds: null }];

    component.submitForm();
    expect(mockRecipeService.createRecipe).toHaveBeenCalledWith({
      name: 'Tuscan Chicken',
      description: undefined,
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      difficultyId: 1,
      ingredients: [
        {
          ingredientId: 'ing-1',
          quantity: 2,
          unitId: mockUnitTbsp.id,
        },
      ],
      steps: [
        {
          stepNumber: 1,
          instructionText: 'Cook chicken in oil',
          timerSeconds: undefined,
        },
      ],
    });
  });
});
