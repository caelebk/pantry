import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TabsComponent } from './tabs.component';
import { Tab } from './tabs.model';

describe('TabsComponent', () => {
  let component: TabsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new TabsComponent());
  });

  it('should create tabs component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit tabSelected on selectTab call', () => {
    const spy = vi.spyOn(component.tabSelected, 'emit');
    component.selectTab(Tab.Recipes);
    expect(spy).toHaveBeenCalledWith(Tab.Recipes);
  });
});
