import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { AuthService } from '../../../core/services/auth.service';
import { IngredientGroupsPageComponent } from './ingredient-groups-page.component';

const groups = [
  {
    id: 1,
    name: 'Beans',
    ingredientCategoryId: 1,
    inStockCount: 5,
    expiringCount: 2,
    expiredCount: 1,
  },
  {
    id: 2,
    name: 'Empty group',
    ingredientCategoryId: 1,
    inStockCount: 0,
    expiringCount: 0,
    expiredCount: 0,
  },
  { id: 3, name: 'Unsorted' },
  { id: 4, name: 'Orphan', ingredientCategoryId: 999 },
];

describe('IngredientGroupsPageComponent', () => {
  let fixture: ComponentFixture<IngredientGroupsPageComponent>;
  let kitchen: ReturnType<typeof signal<{ id: string } | null>>;
  let groupService: { getIngredientGroups: ReturnType<typeof vi.fn> };
  let ingredientService: { getIngredients: ReturnType<typeof vi.fn> };
  let itemService: { getItems: ReturnType<typeof vi.fn> };

  function expandCategories(): void {
    for (const button of fixture.nativeElement.querySelectorAll('section h2 button')) {
      if (button.getAttribute('aria-expanded') === 'false') button.click();
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    kitchen = signal<{ id: string } | null>({ id: 'one' });
    groupService = { getIngredientGroups: vi.fn(() => of(groups)) };
    ingredientService = {
      getIngredients: vi.fn(() => of([{ id: 'bean', name: 'Lentil', ingredientGroup: groups[0] }])),
    };
    itemService = { getItems: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [
        IngredientGroupsPageComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { activeKitchen: kitchen } },
        { provide: IngredientGroupService, useValue: groupService },
        { provide: IngredientService, useValue: ingredientService },
        { provide: ItemService, useValue: itemService },
        {
          provide: IngredientCategoryService,
          useValue: {
            getIngredientCategories: () =>
              of([
                {
                  id: 1,
                  name: 'Protein',
                  icon: 'pi pi-heart',
                  color: '#ef4444',
                  description: 'Meat, seafood, eggs, and plant-based proteins.',
                },
                { id: 2, name: 'Produce', icon: '🥬' },
              ]),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(IngredientGroupsPageComponent);
    fixture.detectChanges();
  });

  it('shows counts, empty groups and unclassified groups without requesting items', () => {
    expandCategories();
    const rows = fixture.nativeElement.querySelectorAll('li');
    expect(rows.length).toBe(4);
    expect(rows[0].textContent).toContain('1 ingredient');
    expect(rows[1].textContent).toContain('0 ingredients');
    expect(fixture.nativeElement.textContent).toContain('Unclassified');
    expect(fixture.nativeElement.textContent).toContain('Orphan');
    expect(itemService.getItems).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('section i.pi-heart')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('🥬');
    expect(fixture.nativeElement.textContent).not.toContain('pi pi-heart');
    expect(fixture.componentInstance.iconClass('pi pi-not-a-real-icon')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('a[href="/inventory/ingredients?groupId=1&from=groups"]'),
    ).toBeTruthy();
  });

  it('starts collapsed and lets each category independently show and hide its groups', () => {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('section h2 button'),
    );
    expect(buttons).toHaveLength(3);
    expect(buttons.every((button) => button.getAttribute('aria-expanded') === 'false')).toBe(true);
    for (const button of buttons) {
      const panelId = button.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`[id="${panelId}"]`)?.hidden).toBe(true);
    }
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
    const protein = buttons.find((button) => button.textContent?.includes('Protein'))!;
    protein.click();
    fixture.detectChanges();
    expect(protein.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(2);
    const panelId = protein.getAttribute('aria-controls')!;
    expect(fixture.nativeElement.querySelector(`[id="${panelId}"]`)).toBeTruthy();
    expect(
      buttons.filter((button) => button.getAttribute('aria-expanded') === 'true'),
    ).toHaveLength(1);
    protein.click();
    fixture.detectChanges();
    expect(protein.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
  });

  it('opens search matches, allows collapse during search, and restores prior expansion after clearing', () => {
    const protein: HTMLButtonElement = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('section h2 button'),
    ).find((button) => button.textContent?.includes('Protein'))!;
    expect(protein).toBeTruthy();
    protein.click();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'unsorted';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const unclassified: HTMLButtonElement =
      fixture.nativeElement.querySelector('section h2 button');
    expect(unclassified.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Unsorted');
    unclassified.click();
    fixture.detectChanges();
    expect(unclassified.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const restored = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('section h2 button'),
    );
    expect(
      restored
        .find((button) => button.textContent?.includes('Protein'))
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
    expect(
      restored
        .find((button) => button.textContent?.includes('Unclassified'))
        ?.getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('searches categories and groups while retaining parent context and empty matches', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'empty';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Protein');
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(1);
    input.value = 'protein';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(2);
    input.value = 'missing';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No matching categories or groups');
  });

  it('waits for all data and cancels pending loads when the kitchen changes', () => {
    const pending = new Subject<typeof groups>();
    groupService.getIngredientGroups.mockReturnValue(pending);
    fixture.componentInstance.retry();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
    expect(pending.observed).toBe(true);
    kitchen.set(null);
    fixture.detectChanges();
    expect(pending.observed).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Select a kitchen');
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
  });

  it('shows a retryable error without partial data and recovers after retry', () => {
    ingredientService.getIngredients.mockReturnValue(throwError(() => new Error('failed')));
    fixture.componentInstance.retry();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unable to load categories and groups');
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
    ingredientService.getIngredients.mockReturnValue(of([]));
    fixture.nativeElement.querySelector('pantry-empty-state button').click();
    fixture.detectChanges();
    expandCategories();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(4);
  });

  it('displays category description in the header and applies category color as border', () => {
    expandCategories();
    const sections = fixture.nativeElement.querySelectorAll('section.taxonomy-section');
    const section = Array.from(sections).find((s: Element) =>
      s.textContent?.includes('Protein'),
    ) as HTMLElement;
    expect(section).toBeTruthy();
    expect(section.style.borderLeftColor).toBe('rgb(239, 68, 68)'); // Hex #ef4444 converts to rgb in style

    // The description should be in the header span
    const headerSpan = section.querySelector('h2 button span.basis-full');
    expect(headerSpan).toBeTruthy();
    expect(headerSpan.textContent).toContain('Meat, seafood, eggs, and plant-based proteins.');
    expect(headerSpan.title).toBe('Meat, seafood, eggs, and plant-based proteins.');
  });

  it('renders stock micro-stats when count > 0 and omits them when count is 0', () => {
    expandCategories();
    const rows = fixture.nativeElement.querySelectorAll('li');
    expect(rows.length).toBeGreaterThan(1);

    // Group 1 (Beans) has 1 expired, 2 expiring, and 5 in-stock
    const beansRow = Array.from(rows).find((r: Element) =>
      r.textContent?.includes('5 in stock'),
    ) as HTMLElement;
    expect(beansRow).toBeTruthy();
    expect(beansRow.textContent).toContain('1 expired');
    expect(beansRow.textContent).toContain('2 expiring');

    // Group 2 (Empty group) has 0 in-stock, 0 expiring, 0 expired, shouldn't show text
    const emptyRow = Array.from(rows).find(
      (r: Element) =>
        !r.textContent?.includes('expired') &&
        !r.textContent?.includes('in stock') &&
        !r.textContent?.includes('expiring') &&
        r.textContent?.includes('0 ingredients'),
    ) as HTMLElement;
    expect(emptyRow).toBeTruthy();
  });

  it('navigates to ingredients catalog when clicking anywhere on a group row', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    expandCategories();
    const rows: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('li'));
    const beansRow = rows.find((r) => r.textContent?.includes('Beans'))!;
    expect(beansRow).toBeTruthy();

    beansRow.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/inventory/ingredients'], {
      queryParams: { groupId: 1, from: 'groups' },
    });
  });

  it('renders badges in order: expired -> expiring -> in stock -> n ingredients', () => {
    expandCategories();
    const rows = fixture.nativeElement.querySelectorAll('li');
    const beansRow = Array.from(rows).find((r: Element) =>
      r.textContent?.includes('Beans'),
    ) as HTMLElement;
    expect(beansRow).toBeTruthy();

    const badges = Array.from(beansRow.querySelectorAll('pantry-badge'));
    expect(badges.length).toBe(4);
    expect(badges[0].textContent).toContain('1 expired');
    expect(badges[1].textContent).toContain('2 expiring');
    expect(badges[2].textContent).toContain('5 in stock');
    expect(badges[3].textContent).toContain('1 ingredient');
  });
});
