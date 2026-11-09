import { computed, Directive, input } from '@angular/core';
import { CardPadding, cardSurfaceClasses, CardVariant } from './card-surface';

/**
 * Applies the `pantry-card` surface to an existing element, for example an `<article>` that must
 * itself be a grid item. Use `<pantry-card>` everywhere else.
 */
@Directive({
  selector: '[pantryCard]',
  standalone: true,
  host: { '[class]': 'surfaceClasses()' },
})
export class CardSurfaceDirective {
  variant = input<CardVariant>('glass');
  hover = input<boolean>(false);
  padding = input<CardPadding>('md');

  surfaceClasses = computed(() => cardSurfaceClasses(this.variant(), this.padding(), this.hover()));
}
