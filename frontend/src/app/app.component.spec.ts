import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { afterEach, vi } from 'vitest';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let reducedMotion: boolean;
  let mediaListeners: Set<EventListener>;

  const mockAuthService = {
    currentUser: signal(null),
    activeKitchen: signal(null),
    userKitchens: signal([]),
    activeKitchenId: signal(null),
    logout: vi.fn(),
  };

  const setReducedMotion = (matches: boolean) => {
    reducedMotion = matches;
    mediaListeners.forEach((listener) => listener({ matches } as unknown as MediaQueryListEvent));
  };

  beforeEach(async () => {
    reducedMotion = false;
    mediaListeners = new Set();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return reducedMotion;
        },
        addEventListener: (_type: string, listener: EventListener) => mediaListeners.add(listener),
        removeEventListener: (_type: string, listener: EventListener) =>
          mediaListeners.delete(listener),
      })),
    );
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
        }),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders a static atmosphere with no canvas or animated waves', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('canvas')).toBeNull();
    expect(element.querySelector('.ambient-wave')).toBeNull();
    expect(element.querySelector('.dot-grid-pattern-overlay')).not.toBeNull();
  });

  it('puts a skip link before the navigation that focuses the main region', () => {
    const element = fixture.nativeElement as HTMLElement;
    const skip = element.querySelector<HTMLAnchorElement>('a[href="#main"]')!;
    const main = element.querySelector<HTMLElement>('main#main')!;
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(
      skip.compareDocumentPosition(element.querySelector('pantry-sidebar')!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    document.body.appendChild(element);
    skip.click();
    expect(document.activeElement).toBe(main);
    element.remove();
  });

  it('tracks the reduced-motion preference and stops listening on destroy', () => {
    expect(component.reducedMotion()).toBe(false);
    setReducedMotion(true);
    expect(component.reducedMotion()).toBe(true);
    setReducedMotion(false);
    expect(component.reducedMotion()).toBe(false);
    fixture.destroy();
    expect(mediaListeners.size).toBe(0);
  });
});
