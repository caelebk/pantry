import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ShoppingItem } from '@models/shopping-list.model';
import { AuthService } from '../core/services/auth.service';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

describe('ShoppingListService', () => {
  let service: ShoppingListService;
  let httpMock: HttpTestingController;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockShoppingItem: ShoppingItem = {
    id: 'sl-1',
    name: 'Milk',
    category: 'Dairy',
    quantity: 1,
    unit: 'gal',
    checked: false,
    estimatedPrice: 4.5,
    storeName: 'Costco',
    source: 'manual',
  };

  beforeEach(() => {
    mockToastService = jasmine.createSpyObj('ToastService', [
      'showSuccess',
      'showError',
      'showInfo',
      'showWarning',
    ]);

    mockAuthService = jasmine.createSpyObj('AuthService', ['activeKitchen']);
    mockAuthService.activeKitchen.and.returnValue('kitchen-1');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ShoppingListService,
        { provide: ToastService, useValue: mockToastService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(ShoppingListService);
    httpMock = TestBed.inject(HttpTestingController);

    // Constructor HTTP load (since effect will run)
    TestBed.flushEffects();
    const initReq = httpMock.expectOne('/api/v1/shopping-list');
    initReq.flush({ status: 'success', data: [mockShoppingItem] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and load initial items', () => {
    expect(service).toBeTruthy();
    expect(service.items().length).toBe(1);
    expect(service.items()[0].name).toBe('Milk');
  });

  it('should add item', () => {
    service.addItem({ name: 'Eggs', category: 'Dairy', quantity: 12 });

    const req = httpMock.expectOne('/api/v1/shopping-list');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'success', data: { ...mockShoppingItem, id: 'sl-2', name: 'Eggs' } });

    expect(service.items().length).toBe(2);
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('should toggle item checked state', () => {
    service.toggleItem('sl-1');

    const req = httpMock.expectOne('/api/v1/shopping-list/sl-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ checked: true });
    req.flush({ status: 'success', data: { ...mockShoppingItem, checked: true } });

    expect(service.items()[0].checked).toBeTrue();
  });

  it('should clear checked items', () => {
    // First set item to checked in signal
    service.toggleItem('sl-1');
    const req1 = httpMock.expectOne('/api/v1/shopping-list/sl-1');
    req1.flush({ status: 'success', data: { ...mockShoppingItem, checked: true } });

    service.clearChecked();
    const req2 = httpMock.expectOne('/api/v1/shopping-list/checked');
    expect(req2.request.method).toBe('DELETE');
    req2.flush({ status: 'success', data: { count: 1 } });

    expect(service.items().length).toBe(0);
    expect(mockToastService.showInfo).toHaveBeenCalled();
  });
});
