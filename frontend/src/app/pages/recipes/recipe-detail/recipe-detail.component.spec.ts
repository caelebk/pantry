import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { UnitService } from '@services/inventory/unit.service';
import { RecipeService } from '@services/recipe.service';
import { ToastService } from '@services/toast.service';
import { ConfirmDialogService } from '@ui';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecipeDetailComponent } from './recipe-detail.component';

describe('RecipeDetailComponent deleteRecipe', () => {
  let component: RecipeDetailComponent;
  let confirm: ReturnType<typeof vi.fn>;
  let deleteRecipe: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let showError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    confirm = vi.fn();
    deleteRecipe = vi.fn(() => of(undefined));
    navigate = vi.fn();
    showError = vi.fn();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: Router, useValue: { navigate } },
        { provide: RecipeService, useValue: { deleteRecipe } },
        { provide: IngredientService, useValue: {} },
        { provide: UnitService, useValue: {} },
        { provide: ItemService, useValue: {} },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: ToastService, useValue: { showError } },
      ],
    });
    component = TestBed.createComponent(RecipeDetailComponent).componentInstance;
    component.recipe = { id: 'r1', name: 'Pasta' } as Recipe;
  });

  it('does not delete when the confirmation is cancelled', async () => {
    confirm.mockResolvedValue(false);
    await component.deleteRecipe();
    expect(deleteRecipe).not.toHaveBeenCalled();
  });

  it('asks for confirmation with translated copy', async () => {
    confirm.mockResolvedValue(false);
    await component.deleteRecipe();
    expect(confirm).toHaveBeenCalledWith({
      title: 'recipeDetail.deleteConfirmTitle',
      message: 'recipeDetail.deleteConfirmMessage',
      acceptLabel: 'recipeDetail.deleteRecipe',
      destructive: true,
    });
  });

  it('deletes and navigates to /recipes when confirmed', async () => {
    confirm.mockResolvedValue(true);
    await component.deleteRecipe();
    expect(deleteRecipe).toHaveBeenCalledWith('r1');
    expect(navigate).toHaveBeenCalledWith(['/recipes']);
  });

  it('shows an error toast when the delete fails', async () => {
    confirm.mockResolvedValue(true);
    deleteRecipe.mockReturnValue(throwError(() => new Error('boom')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await component.deleteRecipe();
    expect(showError).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
