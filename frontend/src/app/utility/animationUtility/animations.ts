import { animate, style, transition, trigger } from '@angular/animations';

// Animation configuration constants
export const FADE_ANIMATION_DURATION_MS = 300;
export const FADE_TRANSLATE_DISTANCE_PX = 20;
export const STAGGER_ANIMATION_DURATION_MS = 400;
export const STAGGER_TRANSLATE_DISTANCE_PX = 20;
export const STAGGER_INITIAL_SCALE = 0.95;
export const STAGGER_FINAL_SCALE = 1;
export const STAGGER_INITIAL_OPACITY = 0;
export const STAGGER_FINAL_OPACITY = 1;
export const STAGGER_DELAY_PER_ITEM_MS = 50;

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
