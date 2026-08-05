import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Recipe } from '@models/recipe.model';
import { firstValueFrom } from 'rxjs';
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

    const req = httpMock.expectOne('/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [mockRecipe] });

    const recipes = await promise;
    expect(recipes.length).toBe(1);
    expect(recipes[0].name).toBe('Pasta Carbonara');
  });

  it('should fetch available recipes', async () => {
    const promise = firstValueFrom(service.getAvailableRecipes());

    const req = httpMock.expectOne('/api/recipes/available');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: [mockRecipe] });

    const recipes = await promise;
    expect(recipes.length).toBe(1);
  });

  it('should fetch recipe by id', async () => {
    const promise = firstValueFrom(service.getRecipeById('rec-1'));

    const req = httpMock.expectOne('/api/recipes/rec-1');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockRecipe });

    const recipe = await promise;
    expect(recipe.id).toBe('rec-1');
  });

  it('should delete recipe', async () => {
    const promise = firstValueFrom(service.deleteRecipe('rec-1'));

    const req = httpMock.expectOne('/api/recipes/rec-1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'success', data: true });

    const result = await promise;
    expect(result).toBeTrue();
  });
});
