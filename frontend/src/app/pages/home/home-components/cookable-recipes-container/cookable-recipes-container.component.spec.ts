import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Recipe } from '@models/recipe.model';
import { describe, expect, it } from 'vitest';
import { CookableRecipesContainerComponent } from './cookable-recipes-container.component';

describe('Home recipe metadata', () => {
  async function render(recipe: Recipe) {
    await TestBed.configureTestingModule({
      imports: [
        CookableRecipesContainerComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: { home: { recipe: { minutes: '{{ count }}m', servings: '{{ count }} serv' } } },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CookableRecipesContainerComponent);
    fixture.componentRef.setInput('recipes', [recipe]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }
  it('omits unknown time and servings without inventing defaults', async () => {
    const element = await render({ id: 'unknown', name: 'Unknown recipe' });
    expect(element.querySelector('.pi-clock')).toBeNull();
    expect(element.querySelector('.pi-users')).toBeNull();
  });
  it('retains explicitly recorded zero values', async () => {
    const element = await render({
      id: 'zero',
      name: 'Zero recipe',
      prepTime: 0,
      cookTime: 0,
      servings: 0,
    });
    expect(element.querySelector('.pi-clock')?.parentElement?.textContent).toContain('0m');
    expect(element.querySelector('.pi-users')?.parentElement?.textContent).toContain('0 serv');
  });
  it('exposes a recipe as a native navigable link', async () => {
    const element = await render({ id: 'recipe-1', name: 'Dinner' });
    const link = element.querySelector('a[href="/recipes/recipe-1"]');
    expect(link?.textContent).toContain('Dinner');
    expect(element.querySelector('a[href="/recipes"]')).not.toBeNull();
  });
});
