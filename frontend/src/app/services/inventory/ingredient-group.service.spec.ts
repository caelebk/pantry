import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IngredientGroup } from '@models/ingredient-group.model';
import { firstValueFrom } from 'rxjs';
import { Kitchen } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { IngredientGroupService } from './ingredient-group.service';

describe('IngredientGroupService', () => {
  let service: IngredientGroupService;
  let httpMock: HttpTestingController;

  const mockGroup: IngredientGroup = {
    id: 1,
    name: 'Poultry',
    ingredientCategoryId: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IngredientGroupService],
    });

    service = TestBed.inject(IngredientGroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all ingredient groups', async () => {
    const promise = firstValueFrom(service.getIngredientGroups());

    const req = httpMock.expectOne('/api/v1/ingredient-groups');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [mockGroup] });

    const groups = await promise;
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe('Poultry');
  });

  it('should refetch groups when the active kitchen changes', async () => {
    const authService = TestBed.inject(AuthService);
    authService.activeKitchen.set({ id: 'kitchen-1' } as Kitchen);

    const first = firstValueFrom(service.getIngredientGroups());
    httpMock.expectOne('/api/v1/ingredient-groups').flush({ status: 'success', data: [mockGroup] });
    expect((await first).length).toBe(1);

    authService.activeKitchen.set({ id: 'kitchen-2' } as Kitchen);
    const second = firstValueFrom(service.getIngredientGroups());
    httpMock
      .expectOne('/api/v1/ingredient-groups')
      .flush({ status: 'success', data: [{ id: 2, name: 'Vegetables' }] });

    const groups = await second;
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe('Vegetables');
  });

  it('should create ingredient group', async () => {
    const promise = firstValueFrom(
      service.createIngredientGroup({ name: 'Poultry', ingredientCategoryId: 1 }),
    );

    const req = httpMock.expectOne('/api/v1/ingredient-groups');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Poultry', ingredientCategoryId: 1 });
    req.flush({ status: 'success', data: mockGroup });

    const group = await promise;
    expect(group.id).toBe(1);
  });

  it('should delete ingredient group', async () => {
    const promise = firstValueFrom(service.deleteIngredientGroup(1));

    const req = httpMock.expectOne('/api/v1/ingredient-groups/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'success', data: true });

    const result = await promise;
    expect(result).toBeTrue();
  });
});
