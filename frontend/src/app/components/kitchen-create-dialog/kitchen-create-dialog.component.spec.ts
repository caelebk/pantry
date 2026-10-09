import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { KitchenCreateDialogComponent } from './kitchen-create-dialog.component';

describe('KitchenCreateDialogComponent', () => {
  let component: KitchenCreateDialogComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTransloco({ config: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
    });
    TestBed.inject(TranslocoService).setTranslation(
      { kitchenCreate: { success: 'Kitchen created', successDetail: 'Ready and selected' } },
      'en',
    );
    component = TestBed.createComponent(KitchenCreateDialogComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);
    component.visible.set(true);
  });
  afterEach(() => http.verify());

  it('restores focus to a stable trigger after dismissal', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    const fixture = TestBed.createComponent(KitchenCreateDialogComponent);
    fixture.componentRef.setInput('returnFocusTo', trigger);
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    fixture.componentInstance.visible.set(false);
    fixture.componentInstance.restoreFocus();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('returns focus to the current responsive trigger even before its effect runs', () => {
    const desktopTrigger = document.createElement('button');
    const mobileTrigger = document.createElement('button');
    document.body.append(desktopTrigger, mobileTrigger);
    const fixture = TestBed.createComponent(KitchenCreateDialogComponent);
    fixture.componentRef.setInput('returnFocusTo', desktopTrigger);
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    desktopTrigger.setAttribute('inert', '');
    fixture.componentRef.setInput('returnFocusTo', mobileTrigger);
    fixture.componentInstance.visible.set(false);
    fixture.componentInstance.restoreFocus();
    expect(document.activeElement).toBe(mobileTrigger);
    desktopTrigger.remove();
    mobileTrigger.remove();
  });

  it('keeps pending creation visible until failure or completion, then permits dismissal', () => {
    component.form.setValue({ name: 'Kitchen', description: 'Dinner' });
    component.submit();
    component.onVisibilityChange(false);
    expect(component.visible()).toBe(true);
    expect(component.pending()).toBe(true);
    http.expectOne('/api/v1/kitchens').flush({}, { status: 500, statusText: 'Server error' });
    component.onVisibilityChange(false);
    expect(component.visible()).toBe(false);
    expect(component.form.getRawValue()).toEqual({ name: 'Kitchen', description: 'Dinner' });
  });

  it('rejects whitespace names without sending a request', () => {
    component.form.setValue({ name: '   ', description: 'Dinner' });
    component.submit();
    expect(component.form.controls.name.touched).toBe(true);
    http.expectNone('/api/v1/kitchens');
    expect(component.visible()).toBe(true);
  });

  it('creates once while pending and updates the shared kitchen cache and selection once', () => {
    component.form.setValue({ name: '  Family kitchen  ', description: '  Dinner  ' });
    component.submit();
    component.submit();
    expect(component.pending()).toBe(true);
    const request = http.expectOne('/api/v1/kitchens');
    expect(request.request.body).toEqual({ name: 'Family kitchen', description: 'Dinner' });
    const kitchen = {
      id: 'created',
      name: 'Family kitchen',
      role: 'owner',
      isPrimary: false,
      memberCount: 1,
    };
    request.flush({ status: 'success', data: kitchen });
    const auth = TestBed.inject(AuthService);
    expect(auth.userKitchens().filter((k) => k.id === 'created')).toHaveLength(1);
    expect(auth.activeKitchen()).toEqual(kitchen);
    expect(component.visible()).toBe(false);
    expect(component.pending()).toBe(false);
    expect(component.form.getRawValue()).toEqual({ name: '', description: '' });
  });

  it('preserves input after failure and allows a single retry', () => {
    component.form.setValue({ name: 'Kitchen', description: 'Weekly dinner' });
    component.submit();
    http.expectOne('/api/v1/kitchens').flush({}, { status: 500, statusText: 'Server error' });
    expect(component.visible()).toBe(true);
    expect(component.pending()).toBe(false);
    expect(component.errorKey()).toBe('kitchenCreate.failure');
    expect(component.form.getRawValue()).toEqual({ name: 'Kitchen', description: 'Weekly dinner' });
    component.submit();
    expect(component.errorKey()).toBe('');
    http.expectOne('/api/v1/kitchens').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(component.errorKey()).toBe('kitchenCreate.forbidden');
  });
});
