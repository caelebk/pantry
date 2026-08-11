import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { vi } from 'vitest';
import { Tab } from '../tabs/tabs.model';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit themeToggled on toggle call', () => {
    const spy = vi.spyOn(component.themeToggled, 'emit');
    component.onToggle();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit tabSelected on tab click', () => {
    const spy = vi.spyOn(component.tabSelected, 'emit');
    component.onTabSelected(Tab.Inventory);
    expect(spy).toHaveBeenCalledWith(Tab.Inventory);
  });
});
