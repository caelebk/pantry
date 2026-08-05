import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { BreadcrumbsComponent } from './breadcrumbs.component';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      url: '/inventory/items/new',
      events: of(),
      navigate: jasmine.createSpy('navigate'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });

    component = TestBed.runInInjectionContext(() => new BreadcrumbsComponent());
    component.ngOnInit();
  });

  it('should create breadcrumbs component', () => {
    expect(component).toBeTruthy();
  });

  it('should build correct breadcrumb items for /inventory/items/new route', () => {
    const items = component.breadcrumbs();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].label).toBe('Home');
    expect(items[items.length - 1].label).toBe('Add New Item');
  });
});
