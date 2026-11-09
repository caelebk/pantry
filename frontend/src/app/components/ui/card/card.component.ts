import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CardPadding, CardVariant, cardSurfaceClasses } from './card-surface';

export type { CardPadding, CardVariant } from './card-surface';

@Component({
  selector: 'pantry-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses()">
      <ng-content select="[header]"></ng-content>
      <ng-content></ng-content>
      <ng-content select="[footer]"></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  variant = input<CardVariant>('glass');
  hover = input<boolean>(false);
  padding = input<CardPadding>('md');

  cardClasses = computed(() => cardSurfaceClasses(this.variant(), this.padding(), this.hover()));
}
