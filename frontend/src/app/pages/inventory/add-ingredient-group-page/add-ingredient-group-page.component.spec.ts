import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { AddIngredientGroupPageComponent } from './add-ingredient-group-page.component';

describe('AddIngredientGroupPageComponent', () => {
  let component: AddIngredientGroupPageComponent;
  let fixture: ComponentFixture<AddIngredientGroupPageComponent>;
  let mockRouter: any;
  let mockIngredientGroupService: any;
  let mockIngredientCategoryService: any;
  let mockIngredientService: any;
  let mockToastService: any;

  const mockCategories = [
    { id: 1, name: 'Fiber & Produce' },
    { id: 2, name: 'Protein & Dairy' },
  ];

  const mockIngredients = [
    {
      id: 'ing-1',
      name: 'Spaghetti',
      ingredientGroup: { id: 10, name: 'Pasta' },
    },
    {
      id: 'ing-2',
      name: 'Chicken Breast',
      ingredientGroup: { id: 20, name: 'Meat' },
    },
    { id: 'ing-3', name: 'Fettuccine', ingredientGroup: undefined },
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockIngredientGroupService = jasmine.createSpyObj('IngredientGroupService', [
      'createIngredientGroup',
    ]);
    mockIngredientCategoryService = jasmine.createSpyObj('IngredientCategoryService', [
      'getIngredientCategories',
    ]);
    mockIngredientService = jasmine.createSpyObj('IngredientService', [
      'getIngredients',
      'createIngredient',
      'updateIngredient',
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);

    mockIngredientCategoryService.getIngredientCategories.and.returnValue(of(mockCategories));
    mockIngredientService.getIngredients.and.returnValue(of(mockIngredients));
    mockIngredientGroupService.createIngredientGroup.and.returnValue(
      of({ id: 100, name: 'Pasta & Grains' }),
    );
    mockIngredientService.createIngredient.and.returnValue(
      of({ id: 'new-1', name: 'Rigatoni', ingredientGroupId: 100 }),
    );
    mockIngredientService.updateIngredient.and.returnValue(
      of({ id: 'ing-1', name: 'Spaghetti', ingredientGroupId: 100 }),
    );

    await TestBed.configureTestingModule({
      imports: [AddIngredientGroupPageComponent, ReactiveFormsModule],
      providers: [
        provideAnimations(),
        { provide: Router, useValue: mockRouter },
        {
          provide: IngredientGroupService,
          useValue: mockIngredientGroupService,
        },
        {
          provide: IngredientCategoryService,
          useValue: mockIngredientCategoryService,
        },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddIngredientGroupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial categories and ingredients', () => {
    expect(component).toBeTruthy();
    expect(component.ingredientCategories().length).toBe(2);
    expect(component.existingIngredients().length).toBe(3);
  });

  it('should compute autocomplete suggestions based on query', () => {
    component.onInputChange('Spag');
    expect(component.suggestions().length).toBe(1);
    expect(component.suggestions()[0].name).toBe('Spaghetti');

    component.onInputChange('chick');
    expect(component.suggestions().length).toBe(1);
    expect(component.suggestions()[0].name).toBe('Chicken Breast');

    component.onInputChange('nonexistent');
    expect(component.suggestions().length).toBe(0);
  });

  it('should select an existing ingredient from suggestions', () => {
    component.onInputChange('Spag');
    const sug = component.suggestions()[0];

    component.selectSuggestion(sug);

    expect(component.initialIngredients().length).toBe(1);
    expect(component.initialIngredients()[0]).toEqual({
      name: 'Spaghetti',
      existingId: 'ing-1',
      isExisting: true,
      groupName: 'Pasta',
    });
    expect(component.newIngredientInput()).toBe('');
  });

  it('should add a new ingredient by name if no match exists', () => {
    component.onInputChange('Farfalle');
    component.addIngredient();

    expect(component.initialIngredients().length).toBe(1);
    expect(component.initialIngredients()[0]).toEqual({
      name: 'Farfalle',
      isExisting: false,
    });
  });

  it('should prevent adding duplicate ingredient names', () => {
    component.onInputChange('Farfalle');
    component.addIngredient();

    component.onInputChange('Farfalle');
    component.addIngredient();

    expect(component.initialIngredients().length).toBe(1);
    expect(mockToastService.showError).toHaveBeenCalledWith(
      '"Farfalle" is already in the ingredients list.',
    );
  });

  it('should remove an ingredient from the selection list', () => {
    component.onInputChange('Farfalle');
    component.addIngredient();
    expect(component.initialIngredients().length).toBe(1);

    component.removeIngredient(0);
    expect(component.initialIngredients().length).toBe(0);
  });

  it('should submit form and create group with both new and existing ingredients', () => {
    component.groupForm.patchValue({
      name: 'Italian Pastas',
      ingredientCategory: mockCategories[0],
    });

    // Add 1 existing ingredient and 1 new ingredient
    component.onInputChange('Spag');
    component.selectSuggestion(component.suggestions()[0]);

    component.onInputChange('Penne');
    component.addIngredient();

    component.onSubmit();

    expect(mockIngredientGroupService.createIngredientGroup).toHaveBeenCalledWith({
      name: 'Italian Pastas',
      ingredientCategoryId: 1,
    });
    expect(mockIngredientService.updateIngredient).toHaveBeenCalledWith('ing-1', {
      ingredientGroupId: 100,
    });
    expect(mockIngredientService.createIngredient).toHaveBeenCalledWith({
      name: 'Penne',
      ingredientGroupId: 100,
    });
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/groups']);
  });

  it('should navigate to /inventory/groups on cancel', () => {
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/groups']);
  });
});
