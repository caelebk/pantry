import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { ToastService } from '@services/toast.service';
import { of, throwError } from 'rxjs';
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

  it('binds the parent category select by id so the current parent is displayed', async () => {
    const groups = {
      getIngredientGroupById: jasmine
        .createSpy()
        .and.returnValue(
          of({ id: 1, name: 'Baking', ingredientCategoryId: 2, ingredientCategoryName: 'Pantry' }),
        ),
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
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p-select').textContent).toContain('Pantry');
  });

  async function setup(
    getGroup: () => unknown,
    getCategories: () => unknown = () => of([{ id: 2, name: 'Pantry' }]),
  ) {
    const groups = { getIngredientGroupById: jasmine.createSpy().and.callFake(getGroup) };
    const categories = { getIngredientCategories: jasmine.createSpy().and.callFake(getCategories) };
    const toast = { showSuccess: jasmine.createSpy(), showError: jasmine.createSpy() };
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
        { provide: IngredientCategoryService, useValue: categories },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EditIngredientGroupPageComponent);
    fixture.detectChanges();
    return { fixture, groups, categories, toast, navigate };
  }

  it('shows an error toast and navigates to groups when the group is not found', async () => {
    const { fixture, toast, navigate } = await setup(() => throwError(() => ({ status: 404 })));
    expect(toast.showError).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/inventory/groups']);
    expect(fixture.componentInstance.loadFailed()).toBe(false);
  });

  it('keeps a retry state on other errors and retry re-runs every loader', async () => {
    const { fixture, groups, categories, navigate } = await setup(() =>
      throwError(() => ({ status: 500 })),
    );
    expect(fixture.componentInstance.loadFailed()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    groups.getIngredientGroupById.and.returnValue(of({ id: 1, name: 'Baking' }));
    fixture.componentInstance.retryLoad();
    expect(groups.getIngredientGroupById).toHaveBeenCalledTimes(2);
    expect(categories.getIngredientCategories).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.loadFailed()).toBe(false);
  });

  it('sets loadFailed when the categories load fails', async () => {
    const { fixture } = await setup(
      () => of({ id: 1, name: 'Baking' }),
      () => throwError(() => ({ status: 500 })),
    );
    expect(fixture.componentInstance.loadFailed()).toBe(true);
  });
});
