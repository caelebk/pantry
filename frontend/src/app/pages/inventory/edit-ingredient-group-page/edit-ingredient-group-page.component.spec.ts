import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EditIngredientGroupPageComponent } from './edit-ingredient-group-page.component';

describe('EditIngredientGroupPageComponent navigation and category assignment', () => {
  it('sends null when clearing a category and returns to categories & groups after saving', async () => {
    const groups = {
      getIngredientGroupById: jasmine
        .createSpy()
        .and.returnValue(of({ id: 1, name: 'Baking', ingredientCategoryId: 2 })),
      updateIngredientGroup: jasmine.createSpy().and.returnValue(of({ id: 1, name: 'Baking' })),
    };
    await TestBed.configureTestingModule({
      imports: [
        EditIngredientGroupPageComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
        { provide: IngredientGroupService, useValue: groups },
        {
          provide: IngredientCategoryService,
          useValue: { getIngredientCategories: () => of([{ id: 2, name: 'Pantry' }]) },
        },
        {
          provide: ToastService,
          useValue: { showSuccess: jasmine.createSpy(), showError: jasmine.createSpy() },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EditIngredientGroupPageComponent);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.groupForm.patchValue({ ingredientCategory: null });
    fixture.componentInstance.onSubmit();
    expect(groups.updateIngredientGroup).toHaveBeenCalledWith(1, {
      name: 'Baking',
      ingredientCategoryId: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/inventory/groups']);
  });
});
