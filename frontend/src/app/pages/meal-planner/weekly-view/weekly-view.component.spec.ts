import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { vi } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { WeeklyViewComponent } from './weekly-view.component';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const meal = (overrides: Partial<PlannedMeal>): PlannedMeal => ({
  id: 'm1',
  day: 'Monday',
  mealType: 'Dinner',
  recipeId: 'r1',
  recipeName: 'Spaghetti',
  cooked: false,
  missingIngredients: [],
  servings: 2,
  ...overrides,
});

describe('WeeklyViewComponent', () => {
  let missing: Record<string, string[] | null>;
  const service = {
    days,
    toggleCooked: vi.fn(),
    removeMealPlan: vi.fn(),
    missingFor: (m: PlannedMeal) => missing[m.id] ?? null,
  };

  const setup = (meals: PlannedMeal[], today = 'Wednesday') => {
    const fixture = TestBed.createComponent(WeeklyViewComponent);
    fixture.componentInstance.today.set(today as never);
    fixture.componentInstance.meals = meals;
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    missing = {};
    service.toggleCooked.mockClear();
    service.removeMealPlan.mockClear();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), { provide: MealPlannerService, useValue: service }],
    });
  });

  it('renders a table with 7 day rows and 4 meal type columns', () => {
    const el: HTMLElement = setup([]).nativeElement;
    const headers = [...el.querySelectorAll('thead th')].map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Day', 'Breakfast', 'Lunch', 'Dinner', 'Snacks']);
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(7);
    rows.forEach((row) => expect(row.querySelectorAll('td').length).toBe(4));
    expect(rows[0].querySelector('th[scope="row"]')?.textContent).toContain('Monday');
  });

  it('puts meals in the right cell and links to the recipe', () => {
    missing = { m1: ['Basil'] };
    const el: HTMLElement = setup([meal({ day: 'Tuesday', mealType: 'Lunch' })]).nativeElement;
    const cell = el.querySelectorAll('tbody tr')[1].querySelectorAll('td')[1];
    expect(cell.textContent).toContain('Spaghetti');
    expect(cell.textContent).toContain('1 missing');
    expect(cell.querySelector('a')?.getAttribute('href')).toBe('/recipes/r1');
    expect(el.querySelectorAll('tbody tr')[0].textContent).not.toContain('Spaghetti');
  });

  it('shows stock status only when stock is known', () => {
    missing = { m1: [], m2: null };
    const el: HTMLElement = setup([
      meal({ id: 'm1' }),
      meal({ id: 'm2', mealType: 'Lunch', recipeName: 'Soup' }),
    ]).nativeElement;
    const cells = el.querySelectorAll('tbody tr')[0].querySelectorAll('td');
    expect(cells[2].textContent).toContain('In stock');
    expect(cells[1].textContent).not.toContain('In stock');
    expect(cells[1].textContent).not.toContain('missing');
  });

  it('marks cooked meals', () => {
    const el: HTMLElement = setup([meal({ cooked: true })]).nativeElement;
    const cell = el.querySelectorAll('tbody tr')[0].querySelectorAll('td')[2];
    expect(cell.textContent).toContain('Cooked');
    expect(cell.querySelector('a')?.className).toContain('line-through');
    expect(cell.querySelector('button[aria-pressed="true"]')?.getAttribute('aria-label')).toBe(
      'Mark Spaghetti as not cooked',
    );
    expect(cell.querySelector('button[aria-pressed="true"] i')?.className).toContain('pi-undo');
  });

  it('marks today on the row header only', () => {
    const el: HTMLElement = setup([], 'Wednesday').nativeElement;
    const current = el.querySelectorAll('tbody th[aria-current="date"]');
    expect(current.length).toBe(1);
    expect(current[0].textContent).toContain('Wednesday');
    expect(current[0].textContent).toContain('Today');
    expect(el.querySelector('tbody tr:first-child th')?.textContent).not.toContain('Today');
  });

  it('computes today from the clock by default', () => {
    const fixture = TestBed.createComponent(WeeklyViewComponent);
    const expected = days[(new Date().getDay() + 6) % 7];
    expect(fixture.componentInstance.today()).toBe(expected);
  });

  it('emits day and meal type from an empty cell', () => {
    const fixture = setup([]);
    const requested = vi.fn();
    fixture.componentInstance.addMealRequested.subscribe(requested);
    const button = fixture.nativeElement
      .querySelectorAll('tbody tr')[2]
      .querySelectorAll('td')[2]
      .querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Add dinner');
    button.click();
    expect(requested).toHaveBeenCalledWith({ day: 'Wednesday', mealType: 'Dinner' });
  });

  it('calls the service to toggle cooked and remove', () => {
    const el: HTMLElement = setup([meal({})]).nativeElement;
    const cell = el.querySelectorAll('tbody tr')[0].querySelectorAll('td')[2];
    (cell.querySelector('[aria-label="Mark Spaghetti as cooked"]') as HTMLButtonElement).click();
    expect(service.toggleCooked).toHaveBeenCalledWith('m1');
    (cell.querySelector('[aria-label="Remove Spaghetti from plan"]') as HTMLButtonElement).click();
    expect(service.removeMealPlan).toHaveBeenCalledWith('m1');
  });

  it('lists days with only filled meals on phones and emits the day for add', () => {
    const fixture = setup([meal({ day: 'Thursday' })]);
    const requested = vi.fn();
    fixture.componentInstance.addMealRequested.subscribe(requested);
    const items = fixture.nativeElement.querySelectorAll('ul > li');
    expect(items.length).toBe(7);
    expect(items[3].textContent).toContain('Dinner');
    expect(items[3].textContent).toContain('Spaghetti');
    expect(items[3].textContent).not.toContain('Nothing planned');
    expect(items[0].textContent).toContain('Nothing planned');
    expect(items[3].querySelector('[aria-label="Remove Spaghetti from plan"]')?.className).toBe(
      'btn-icon',
    );
    (items[3].querySelector('[aria-label="Add a meal for Thursday"]') as HTMLButtonElement).click();
    expect(requested).toHaveBeenCalledWith({ day: 'Thursday', mealType: undefined });
  });
});
