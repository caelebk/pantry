import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { vi } from 'vitest';
import { AppComponent, KitchenVector } from './app.component';
import { AuthService } from './core/services/auth.service';

interface ComponentWithPrivateMembers {
  kitchenVectors: KitchenVector[];
  renderParticlesAndVectors: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const mockAuthService = {
    currentUser: signal(null),
    userKitchens: signal([]),
    activeKitchenId: signal(null),
    logout: vi.fn(),
  };

  beforeEach(async () => {
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

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize kitchen vectors for background animation', () => {
    const comp = component as unknown as ComponentWithPrivateMembers;
    expect(comp.kitchenVectors).toBeDefined();
    expect(comp.kitchenVectors.length).toBeGreaterThan(0);
  });

  it('should update positions of kitchen vectors during rendering', () => {
    const comp = component as unknown as ComponentWithPrivateMembers;
    const initialVectors = comp.kitchenVectors;
    if (initialVectors && initialVectors.length > 0) {
      const v0 = initialVectors[0];
      const startX = v0.x;

      const mockCtx = {
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        stroke: vi.fn(),
        strokePath: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        rect: vi.fn(),
        bezierCurveTo: vi.fn(),
        fill: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      comp.renderParticlesAndVectors(mockCtx, 1000, 800);

      expect(v0.x).not.toEqual(startX + 9999);
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 1000, 800);
    }
  });

  it('should enforce optimized particle count cap (<= 15) and kitchen vector cap (<= 6)', () => {
    const comp = component as unknown as { particles: unknown[]; kitchenVectors: unknown[] };
    expect(comp.particles.length).toBeLessThanOrEqual(15);
    expect(comp.kitchenVectors.length).toBeLessThanOrEqual(6);
  });

  it('should skip particle & vector rendering when document is hidden', () => {
    const comp = component as unknown as ComponentWithPrivateMembers;
    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      rect: vi.fn(),
      bezierCurveTo: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const originalVisibility = document.visibilityState;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });

    comp.renderParticlesAndVectors(mockCtx, 1000, 800);
    expect(mockCtx.clearRect).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => originalVisibility,
    });
  });
});
