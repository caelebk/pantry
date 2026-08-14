import { animate, style, transition, trigger } from '@angular/animations';

// Animation configuration constants (Optimized for snappy 60 FPS UX)
export const FADE_ANIMATION_DURATION_MS = 160;
export const FADE_TRANSLATE_DISTANCE_PX = 6;
export const STAGGER_ANIMATION_DURATION_MS = 180;
export const STAGGER_TRANSLATE_DISTANCE_PX = 6;
export const STAGGER_INITIAL_SCALE = 0.98;
export const STAGGER_FINAL_SCALE = 1;
export const STAGGER_INITIAL_OPACITY = 0;
export const STAGGER_FINAL_OPACITY = 1;
export const STAGGER_DELAY_PER_ITEM_MS = 10;

/**
 * Fade in/out animation with vertical translation
 * Usage: [@fadeInOut]
 */
export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({
      opacity: STAGGER_INITIAL_OPACITY,
      transform: `translateY(${FADE_TRANSLATE_DISTANCE_PX}px)`,
    }),
    animate(
      `${FADE_ANIMATION_DURATION_MS}ms ease-out`,
      style({
        opacity: STAGGER_FINAL_OPACITY,
        transform: 'translateY(0)',
      }),
    ),
  ]),
  transition(':leave', [
    animate(
      `${FADE_ANIMATION_DURATION_MS}ms ease-in`,
      style({
        opacity: STAGGER_INITIAL_OPACITY,
        transform: `translateY(${FADE_TRANSLATE_DISTANCE_PX}px)`,
      }),
    ),
  ]),
]);

/**
 * Staggered fade in animation with vertical translation and scale
 * Usage: [@staggeredFadeIn]="{ value: '', params: { delay: index * STAGGER_DELAY_PER_ITEM_MS } }"
 */
export const staggeredFadeIn = trigger('staggeredFadeIn', [
  transition(':enter', [
    style({
      opacity: STAGGER_INITIAL_OPACITY,
      transform: `translateY(${STAGGER_TRANSLATE_DISTANCE_PX}px) scale(${STAGGER_INITIAL_SCALE})`,
    }),
    animate(
      `${STAGGER_ANIMATION_DURATION_MS}ms {{delay}}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
      style({
        opacity: STAGGER_FINAL_OPACITY,
        transform: `translateY(0) scale(${STAGGER_FINAL_SCALE})`,
      }),
    ),
  ]),
]);

/**
 * Hardware-accelerated smooth route transition animation
 * Usage: [@routeTransition]="prepareRoute(outlet)"
 */
export const routeTransition = trigger('routeTransition', [
  transition('* => *', [
    style({
      opacity: 0,
      transform: 'translateY(6px)',
    }),
    animate(
      '160ms cubic-bezier(0.16, 1, 0.3, 1)',
      style({
        opacity: 1,
        transform: 'translateY(0)',
      }),
    ),
  ]),
]);
