import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Recipe } from '@models/recipe.model';
import { firstValueFrom } from 'rxjs';
import { Kitchen } from '../core/models/auth.model';
import { AuthService } from '../core/services/auth.service';
import { RecipeService } from './recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;
  let httpMock: HttpTestingController;

  const mockRecipe: Recipe = {
    id: 'rec-1',
    name: 'Pasta Carbonara',
    description: 'Classic Roman pasta',
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    difficulty: 'Medium',
    ingredients: [],
    steps: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecipeService],
    });

    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch recipes', async () => {
    const promise = firstValueFrom(service.getRecipes());

    const req = httpMock.expectOne('/api/v1/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [mockRecipe] });

    const recipes = await promise;
    expect(recipes.length).toBe(1);
    expect(recipes[0].name).toBe('Pasta Carbonara');
  });

  it('should fetch available recipes', async () => {
    const promise = firstValueFrom(service.getAvailableRecipes());

    const req = httpMock.expectOne('/api/v1/recipes/available');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [mockRecipe] });

    const recipes = await promise;
    expect(recipes.length).toBe(1);
  });

  it('should refetch recipes when the active kitchen changes', async () => {
    const authService = TestBed.inject(AuthService);
    authService.activeKitchen.set({ id: 'kitchen-1' } as Kitchen);

    const first = firstValueFrom(service.getRecipes());
    httpMock.expectOne('/api/v1/recipes').flush({ status: 'success', data: [mockRecipe] });
    expect((await first).length).toBe(1);

    authService.activeKitchen.set({ id: 'kitchen-2' } as Kitchen);
    const second = firstValueFrom(service.getRecipes());
    httpMock
      .expectOne('/api/v1/recipes')
      .flush({ status: 'success', data: [{ ...mockRecipe, id: 'rec-2', name: 'Salad' }] });

    const recipes = await second;
    expect(recipes.length).toBe(1);
    expect(recipes[0].name).toBe('Salad');
  });

  it('should refetch available recipes when the active kitchen changes', async () => {
    const authService = TestBed.inject(AuthService);
    authService.activeKitchen.set({ id: 'kitchen-1' } as Kitchen);

    const first = firstValueFrom(service.getAvailableRecipes());
    httpMock
      .expectOne('/api/v1/recipes/available')
      .flush({ status: 'success', data: [mockRecipe] });
    expect((await first).length).toBe(1);

    authService.activeKitchen.set({ id: 'kitchen-2' } as Kitchen);
    const second = firstValueFrom(service.getAvailableRecipes());
    httpMock.expectOne('/api/v1/recipes/available').flush({ status: 'success', data: [] });

    expect(await second).toEqual([]);
  });

  it('should fetch recipe by id', async () => {
    const promise = firstValueFrom(service.getRecipeById('rec-1'));

    const req = httpMock.expectOne('/api/v1/recipes/rec-1');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockRecipe });

    const recipe = await promise;
    expect(recipe.id).toBe('rec-1');
  });

  it('should delete recipe', async () => {
    const promise = firstValueFrom(service.deleteRecipe('rec-1'));

    const req = httpMock.expectOne('/api/v1/recipes/rec-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'success', data: true });

    const result = await promise;
    expect(result).toBeTrue();
  });
});
