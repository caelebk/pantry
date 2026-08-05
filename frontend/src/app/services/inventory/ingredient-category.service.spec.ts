import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IngredientCategory } from '@models/ingredient-category.model';
import { firstValueFrom } from 'rxjs';
import { IngredientCategoryService } from './ingredient-category.service';

describe('IngredientCategoryService', () => {
  let service: IngredientCategoryService;
  let httpMock: HttpTestingController;

  const mockCategories: IngredientCategory[] = [
    { id: 1, name: 'Protein & Dairy' },
    { id: 2, name: 'Fiber & Produce' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IngredientCategoryService],
    });

    service = TestBed.inject(IngredientCategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all ingredient categories', async () => {
    const promise = firstValueFrom(service.getIngredientCategories());

    const req = httpMock.expectOne('/api/ingredient-categories');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockCategories });

    const categories = await promise;
    expect(categories.length).toBe(2);
    expect(categories[0].name).toBe('Protein & Dairy');
  });

  it('should fetch ingredient category by id', async () => {
    const promise = firstValueFrom(service.getIngredientCategoryById(1));

    const req = httpMock.expectOne('/api/ingredient-categories/1');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockCategories[0] });

    const category = await promise;
    expect(category.id).toBe(1);
    expect(category.name).toBe('Protein & Dairy');
  });

  it('should support legacy alias getNutrientGroups', async () => {
    const promise = firstValueFrom(service.getNutrientGroups());

    const req = httpMock.expectOne('/api/ingredient-categories');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockCategories });

    const res = await promise;
    expect(res.length).toBe(2);
  });
});
