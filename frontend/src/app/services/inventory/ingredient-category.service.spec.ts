import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IngredientCategory } from '@models/ingredient-category.model';
import { firstValueFrom } from 'rxjs';
import { Kitchen } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
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

    const req = httpMock.expectOne('/api/v1/ingredient-categories');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockCategories });

    const categories = await promise;
    expect(categories.length).toBe(2);
    expect(categories[0].name).toBe('Protein & Dairy');
  });

  it('should refetch categories when the active kitchen changes', async () => {
    const authService = TestBed.inject(AuthService);
    authService.activeKitchen.set({ id: 'kitchen-1' } as Kitchen);

    const first = firstValueFrom(service.getIngredientCategories());
    httpMock.expectOne('/api/v1/ingredient-categories').flush({
      status: 'success',
      data: mockCategories,
    });
    expect((await first).length).toBe(2);

    authService.activeKitchen.set({ id: 'kitchen-2' } as Kitchen);
    const second = firstValueFrom(service.getIngredientCategories());
    httpMock
      .expectOne('/api/v1/ingredient-categories')
      .flush({ status: 'success', data: [{ id: 3, name: 'Spices & Baking' }] });

    const categories = await second;
    expect(categories.length).toBe(1);
    expect(categories[0].name).toBe('Spices & Baking');
  });

  it('should fetch ingredient category by id', async () => {
    const promise = firstValueFrom(service.getIngredientCategoryById(1));

    const req = httpMock.expectOne('/api/v1/ingredient-categories/1');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockCategories[0] });

    const category = await promise;
    expect(category.id).toBe(1);
    expect(category.name).toBe('Protein & Dairy');
  });
});
