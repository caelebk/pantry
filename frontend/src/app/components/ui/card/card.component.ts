import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardVariant = 'glass' | 'sub' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

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

  cardClasses = computed(() => {
    const variantMap: Record<CardVariant, string> = {
      glass:
        'glass-card rounded-2xl border border-surface-200/80 dark:border-surface-800/80 shadow-xs',
      sub: 'sub-card rounded-xl border border-surface-200/70 dark:border-surface-800/70',
      elevated:
        'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-lg',
    };

    const paddingMap: Record<CardPadding, string> = {
      none: '',
      sm: 'p-3 sm:p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    const hoverClass = this.hover() ? 'sub-card-hover cursor-pointer' : '';

    return `${variantMap[this.variant()]} ${paddingMap[this.padding()]} ${hoverClass} transition-all duration-200`;
  });
}
