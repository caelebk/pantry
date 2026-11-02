import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { afterEach, vi } from 'vitest';
import { AppComponent, KitchenVector } from './app.component';
import { AuthService } from './core/services/auth.service';

interface ComponentWithPrivateMembers {
  kitchenVectors: KitchenVector[];
  renderParticlesAndVectors: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameScale?: number,
  ) => void;
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const mockAuthService = {
    currentUser: signal(null),
    activeKitchen: signal(null),
    userKitchens: signal([]),
    activeKitchenId: signal(null),
    logout: vi.fn(),
  };

  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let reducedMotion: boolean;
  let mediaListeners: Set<EventListener>;
  let context: CanvasRenderingContext2D;

  const advanceFrame = (timestamp: number) => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(timestamp));
  };

  const setReducedMotion = (matches: boolean) => {
    reducedMotion = matches;
    mediaListeners.forEach((listener) => listener({ matches } as unknown as MediaQueryListEvent));
  };

  beforeEach(async () => {
    frames = new Map();
    nextFrame = 0;
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
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    context = Object.fromEntries(
      [
        'clearRect',
        'save',
        'restore',
        'translate',
        'rotate',
        'scale',
        'stroke',
        'beginPath',
        'closePath',
        'arc',
        'arcTo',
        'rect',
        'bezierCurveTo',
        'fill',
        'moveTo',
        'lineTo',
      ].map((name) => [name, vi.fn()]),
    ) as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
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

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('keeps the three waves in independent animation layers', () => {
    expect(fixture.nativeElement.querySelectorAll('.ambient-wave')).toHaveLength(3);
  });

  it('preserves motion speed when drawing at a lower frame rate', () => {
    const comp = component as unknown as ComponentWithPrivateMembers;
    const vector = comp.kitchenVectors[0];
    vector.x = 200;
    vector.y = 200;
    vector.vx = 0.25;
    vector.vy = 0.1;
    vector.rotation = 0;
    vector.vRot = 0.01;

    comp.renderParticlesAndVectors(context, 1000, 800, 2);
    expect(vector.x).toBeCloseTo(200.5);
    expect(vector.y).toBeCloseTo(200.2);
    expect(vector.rotation).toBeCloseTo(0.02);
    comp.renderParticlesAndVectors(context, 1000, 800, 0);
    expect(vector.x).toBeCloseTo(200.5);
    expect(vector.rotation).toBeCloseTo(0.02);
  });

  it('caches kitchen geometry and reuses the same paths on subsequent frames', () => {
    const paths: object[] = [];
    const geometry = vi.fn();
    class CachedPath {
      constructor() {
        paths.push(this);
        Object.assign(
          this,
          Object.fromEntries(
            ['moveTo', 'lineTo', 'closePath', 'arc', 'arcTo', 'rect', 'bezierCurveTo'].map(
              (method) => [method, geometry],
            ),
          ),
        );
      }
    }
    vi.stubGlobal('Path2D', CachedPath);
    const comp = component as unknown as ComponentWithPrivateMembers;
    const stroke = vi.mocked(context.stroke);
    stroke.mockClear();
    comp.renderParticlesAndVectors(context, 1000, 800, 0);
    expect(paths).toHaveLength(new Set(comp.kitchenVectors.map((vector) => vector.type)).size);
    expect(geometry).toHaveBeenCalled();
    const firstFramePaths = stroke.mock.calls
      .filter((call) => call.length > 0)
      .map((call) => call[0]);
    const geometryCalls = geometry.mock.calls.length;
    stroke.mockClear();
    comp.renderParticlesAndVectors(context, 1000, 800, 2);
    const secondFramePaths = stroke.mock.calls
      .filter((call) => call.length > 0)
      .map((call) => call[0]);
    expect(secondFramePaths).toEqual(firstFramePaths);
    expect(secondFramePaths).toHaveLength(comp.kitchenVectors.length);
    secondFramePaths.forEach((path, index) => expect(path).toBe(firstFramePaths[index]));
    expect(geometry).toHaveBeenCalledTimes(geometryCalls);
    expect(paths).toHaveLength(new Set(comp.kitchenVectors.map((vector) => vector.type)).size);
  });

  it('caps canvas redraws at 30 frames per second', () => {
    const comp = component as unknown as ComponentWithPrivateMembers;
    const render = vi.spyOn(comp, 'renderParticlesAndVectors');
    for (let timestamp = 0; timestamp <= 1000; timestamp += 1000 / 120) {
      advanceFrame(timestamp);
    }
    expect(render.mock.calls.length).toBeGreaterThan(20);
    expect(render.mock.calls.length).toBeLessThanOrEqual(31);
    expect(render.mock.calls.some((call) => (call[3] ?? 0) >= 1.9)).toBe(true);
  });

  it('redraws reduced-motion decoration only when its inputs change', () => {
    setReducedMotion(true);
    const comp = component as unknown as ComponentWithPrivateMembers;
    const render = vi.spyOn(comp, 'renderParticlesAndVectors');
    expect(frames.size).toBe(0);
    window.dispatchEvent(new Event('resize'));
    component.toggleTheme();
    fixture.detectChanges();
    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls.every((call) => call[3] === 0)).toBe(true);
    expect(frames.size).toBe(0);
  });

  it('pauses live reduced-motion changes and resumes without catching up elapsed time', () => {
    const comp = component as unknown as ComponentWithPrivateMembers;
    const render = vi.spyOn(comp, 'renderParticlesAndVectors');
    const waves = fixture.nativeElement.querySelector('.ambient-waves') as HTMLElement;
    advanceFrame(0);
    advanceFrame(40);
    setReducedMotion(true);
    expect(frames.size).toBe(0);
    expect(waves.classList.contains('is-paused')).toBe(true);
    setReducedMotion(false);
    expect(frames.size).toBe(1);
    expect(waves.classList.contains('is-paused')).toBe(false);
    render.mockClear();
    advanceFrame(60_000);
    advanceFrame(60_040);
    expect(render.mock.calls.every((call) => (call[3] ?? 0) <= 3)).toBe(true);
  });

  it('pauses hidden tabs and cleans up all animation listeners and frames', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    const waves = fixture.nativeElement.querySelector('.ambient-waves') as HTMLElement;
    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(waves.classList.contains('is-paused')).toBe(true);
    expect(frames.size).toBe(0);
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(waves.classList.contains('is-paused')).toBe(false);
    expect(frames.size).toBe(1);
    const comp = component as unknown as ComponentWithPrivateMembers;
    const render = vi.spyOn(comp, 'renderParticlesAndVectors');
    fixture.destroy();
    expect(frames.size).toBe(0);
    expect(mediaListeners.size).toBe(0);
    window.dispatchEvent(new Event('resize'));
    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(render).not.toHaveBeenCalled();
    expect(waves.classList.contains('is-paused')).toBe(false);
  });

  it('responds to pointer movement and removes pointer listeners on destroy', () => {
    const comp = component as unknown as { mouse: { x: number; y: number } };
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 200 }));
    expect(comp.mouse).toMatchObject({ x: 150, y: 200 });
    window.dispatchEvent(new Event('mouseleave'));
    expect(comp.mouse.x).toBeLessThan(0);
    fixture.destroy();
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 400 }));
    expect(comp.mouse.x).toBeLessThan(0);
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
