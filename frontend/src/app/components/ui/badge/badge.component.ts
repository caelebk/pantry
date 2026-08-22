import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant =
  | 'fresh'
  | 'expiring'
  | 'expired'
  | 'primary'
  | 'neutral'
  | 'location'
  | 'outline'
  | 'indigo'
  | 'purple';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'pantry-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses()">
      @if (dot()) {
        <span [class]="dotClasses()" aria-hidden="true"></span>
      }
      @if (icon()) {
        <i [class]="icon() + ' ' + iconSizeClass()" aria-hidden="true"></i>
      }
      <ng-content></ng-content>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  size = input<BadgeSize>('md');
  icon = input<string>();
  dot = input<boolean>(false);
  /** Animates the dot (live status indicators, e.g. real-time stock counts). */
  live = input<boolean>(false);

  badgeClasses = computed(() => {
    const sizeMap: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-[10px] gap-1 font-semibold rounded-md',
      md: 'px-2.5 py-1 text-xs gap-1.5 font-bold rounded-lg',
    };

    const variantMap: Record<BadgeVariant, string> = {
      fresh:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      expiring: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      expired: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      primary:
        'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20',
      neutral:
        'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-700',
      location:
        'bg-surface-100 dark:bg-surface-800/80 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-white/10 font-semibold',
      outline:
        'bg-transparent text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700',
      indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    };

    return `inline-flex items-center justify-center border transition-colors ${sizeMap[this.size()]} ${variantMap[this.variant()]}`;
  });

  dotClasses = computed(() => {
    const dotMap: Record<BadgeVariant, string> = {
      fresh: 'bg-emerald-500',
      expiring: 'bg-amber-500',
      expired: 'bg-rose-500',
      primary: 'bg-primary-500',
      neutral: 'bg-surface-400',
      location: 'bg-primary-500',
      outline: 'bg-surface-400',
      indigo: 'bg-indigo-500',
      purple: 'bg-purple-500',
    };
    const liveClass = this.live() ? ' animate-pulse' : '';
    return `w-1.5 h-1.5 rounded-full ${dotMap[this.variant()]}${liveClass}`;
  });

  iconSizeClass = computed(() => (this.size() === 'sm' ? 'text-[10px]' : 'text-xs'));
}
