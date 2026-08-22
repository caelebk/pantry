import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IngredientDTO } from '@models/ingredient.model';
import { UnitType } from '@models/unit.model';
import { firstValueFrom, of } from 'rxjs';
import { IngredientGroupService } from './ingredient-group.service';
import { IngredientService } from './ingredient.service';
import { UnitService } from './unit.service';

describe('IngredientService', () => {
  let service: IngredientService;
  let httpMock: HttpTestingController;
  let mockGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;

  const mockIngredientDTO: IngredientDTO = {
    id: 'ing-1',
    name: 'Chicken Breast',
    ingredientGroupId: 1,
    defaultUnitId: 2,
  };

  beforeEach(() => {
    mockGroupService = jasmine.createSpyObj('IngredientGroupService', ['getIngredientGroups']);
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);

    mockGroupService.getIngredientGroups.and.returnValue(
      of([{ id: 1, name: 'Poultry', ingredientCategoryId: 1 }]),
    );
    mockUnitService.getUnits.and.returnValue(
      of([{ id: 2, name: 'lbs', shortName: 'lbs', type: UnitType.Mass, toBaseFactor: 453.592 }]),
    );

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        IngredientService,
        { provide: IngredientGroupService, useValue: mockGroupService },
        { provide: UnitService, useValue: mockUnitService },
      ],
    });

    service = TestBed.inject(IngredientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shares the ingredients request across subscribers', async () => {
    const first = firstValueFrom(service.getIngredients());
    const second = firstValueFrom(service.getIngredients());

    const req = httpMock.expectOne('/api/v1/ingredients');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [] });

    expect(await first).toEqual([]);
    expect(await second).toEqual([]);
  });

  it('should fetch ingredients and map group & unit references', async () => {
    const promise = firstValueFrom(service.getIngredients());

    const req = httpMock.expectOne('/api/v1/ingredients');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [mockIngredientDTO] });

    const ingredients = await promise;
    expect(ingredients.length).toBe(1);
    expect(ingredients[0].name).toBe('Chicken Breast');
    expect(ingredients[0].ingredientGroup?.name).toBe('Poultry');
    expect(ingredients[0].defaultUnit?.shortName).toBe('lbs');
  });

  it('should create new ingredient', async () => {
    const promise = firstValueFrom(service.createIngredient({ name: 'Salt', defaultUnitId: 1 }));

    const req = httpMock.expectOne('/api/v1/ingredients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Salt', defaultUnitId: 1 });
    req.flush({ status: 'success', data: { ...mockIngredientDTO, name: 'Salt' } });

    const created = await promise;
    expect(created.name).toBe('Salt');
  });

  it('should reconcile ingredient unit', async () => {
    const items = [{ id: 'item-1', quantity: 2 }];
    const promise = firstValueFrom(service.reconcileIngredientUnit('ing-1', 2, items));

    const req = httpMock.expectOne('/api/v1/ingredients/ing-1/reconcile-units');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ newDefaultUnitId: 2, items });
    req.flush({ status: 'success', data: mockIngredientDTO });

    const result = await promise;
    expect(result.id).toBe('ing-1');
  });
});
