import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { StoreService } from '@services/store.service';
import { ToastService } from '@services/toast.service';
import { of, throwError } from 'rxjs';
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
  let mockToast: { showError: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<StoresPageComponent>;

  const mockStores = [
    { id: 's1', name: "Trader Joe's", archived: false, kitchenId: 'k1', createdAt: new Date() },
    { id: 's2', name: 'Costco', archived: true, kitchenId: 'k1', createdAt: new Date() },
  ];

  beforeEach(() => {
    mockToast = { showError: vi.fn() };
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
        { provide: ToastService, useValue: mockToast },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture = TestBed.createComponent(StoresPageComponent);
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

  it('should toast and keep input when create fails', () => {
    mockStoreService.createStore.mockReturnValue(throwError(() => new Error('fail')));
    component.newStoreName.set('Whole Foods');
    component.createStore();

    expect(mockToast.showError).toHaveBeenCalledTimes(1);
    expect(component.newStoreName()).toBe('Whole Foods');
    expect(component.isCreating()).toBe(false);
  });

  it('should toast and stay in edit mode when rename fails', () => {
    mockStoreService.updateStore.mockReturnValue(throwError(() => new Error('fail')));
    component.startEditing(mockStores[0]);
    component.setDraftName('s1', 'New Name');
    component.save(mockStores[0]);

    expect(mockToast.showError).toHaveBeenCalledTimes(1);
    expect(component.editingStoreId()).toBe('s1');
    expect(component.draftNames()['s1']).toBe('New Name');
  });

  it('should toast when archive fails', () => {
    mockStoreService.updateStore.mockReturnValue(throwError(() => new Error('fail')));
    component.archive(mockStores[0]);

    expect(mockToast.showError).toHaveBeenCalledTimes(1);
  });

  it('should focus the input on edit start and the rename button on cancel', async () => {
    const root = fixture.nativeElement as HTMLElement;
    component.startEditing(mockStores[0]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(root.querySelector('input[data-edit-input]'));
    expect(root.querySelector('[data-rename-id="s1"]')).toBeNull();

    component.cancelEditing();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(root.querySelector('[data-rename-id="s1"]'));
  });
});
