import { vi } from 'vitest';
import { Tab } from '../tabs/tabs.model';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;

  beforeEach(() => {
    component = new HeaderComponent();
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
