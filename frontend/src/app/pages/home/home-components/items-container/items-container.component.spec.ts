import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme } from '@models/items.model';
import { UnitType } from '@models/unit.model';
import { describe, expect, it, vi } from 'vitest';
import { ItemsContainerComponent } from './items-container.component';

const item: Item = {
  id: 'stock-1',
  name: 'Expired tomatoes',
  quantity: 2,
  unit: { id: 1, name: 'pieces', shortName: 'pcs', type: UnitType.Count, toBaseFactor: 1 },
  location: { id: 1, name: 'Fridge' },
  purchaseDate: new Date('2020-01-01'),
  expirationDate: new Date('2020-01-02'),
  notes: '',
};

describe('Home stock rows', () => {
  async function render(items: Item[] = [item]) {
    await TestBed.configureTestingModule({
      imports: [
        ItemsContainerComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              home: { stock: { editItem: 'Edit {{ name }}', removeItem: 'Remove {{ name }}' } },
            },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ItemsContainerComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('titleKey', 'home.stock.title');
    fixture.componentRef.setInput('footerMessageKey', 'home.stock.more');
    fixture.componentRef.setInput('theme', ItemsContainerTheme.Red);
    fixture.detectChanges();
    return fixture;
  }
  it('keeps expired names readable and exposes persistent named actions', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h4')?.className).not.toContain('line-through');
    const remove = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove Expired tomatoes"]',
    );
    expect(remove).not.toBeNull();
    expect(remove?.classList.contains('btn-icon')).toBe(true);
    expect(remove?.closest('[class*="opacity-0"]')).toBeNull();
    expect(
      element.querySelector('a[href="/inventory/items/stock-1/edit"]')?.getAttribute('aria-label'),
    ).toBe('Edit Expired tomatoes');
    const listener = vi.fn();
    fixture.componentInstance.removeItem.subscribe(listener);
    remove?.click();
    expect(listener).toHaveBeenCalledWith(item);
  });
  it('provides a canonical empty state', async () => {
    const fixture = await render([]);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('pantry-empty-state')).not.toBeNull();
  });
  it('bounds the Home preview and links remaining stock to inventory', async () => {
    const fixture = await render(
      Array.from({ length: 5 }, (_, i) => ({ ...item, id: `stock-${i}` })),
    );
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.stock-row')).toHaveLength(4);
    expect(element.querySelector('a[href="/inventory/items"]')).not.toBeNull();
    expect(element.querySelector('a[href="/inventory/items"]')?.textContent).toContain('+1');
  });
});
