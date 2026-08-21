import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { StoreService } from '@services/store.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { StoresPageComponent } from './stores-page.component';

describe('StoresPageComponent', () => {
  let component: StoresPageComponent;
  let mockStoreService: {
    getStores: ReturnType<typeof vi.fn>;
    createStore: ReturnType<typeof vi.fn>;
    updateStore: ReturnType<typeof vi.fn>;
    archiveStore: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockStores = [
    { id: 's1', name: "Trader Joe's", archived: false, kitchenId: 'k1', createdAt: new Date() },
    { id: 's2', name: 'Costco', archived: true, kitchenId: 'k1', createdAt: new Date() },
  ];

  beforeEach(() => {
    mockStoreService = {
      getStores: vi.fn().mockReturnValue(of(mockStores)),
      createStore: vi.fn().mockReturnValue(of({ id: 's3', name: 'Whole Foods' })),
      updateStore: vi.fn().mockReturnValue(of({ id: 's1', name: "Trader Joe's Express" })),
      archiveStore: vi.fn().mockReturnValue(of({ id: 's1', archived: true })),
    };

    TestBed.configureTestingModule({
      imports: [StoresPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: TranslocoHttpLoader,
        }),
        { provide: StoreService, useValue: mockStoreService },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    const fixture = TestBed.createComponent(StoresPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load stores list', () => {
    expect(component).toBeTruthy();
    expect(mockStoreService.getStores).toHaveBeenCalled();
    expect(component.stores().length).toBe(2);
  });

  it('should create new store and reset input field', () => {
    component.newStoreName.set('Whole Foods');
    component.createStore();

    expect(mockStoreService.createStore).toHaveBeenCalledWith('Whole Foods');
    expect(component.newStoreName()).toBe('');
  });

  it('should toggle inline editing for a store', () => {
    component.startEditing(mockStores[0]);
    expect(component.editingStoreId()).toBe('s1');

    component.cancelEditing();
    expect(component.editingStoreId()).toBeNull();
  });
});
