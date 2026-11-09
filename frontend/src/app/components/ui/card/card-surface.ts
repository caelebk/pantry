export type CardVariant = 'glass' | 'sub' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  glass: 'glass-card rounded-2xl border border-surface-200/80 dark:border-surface-800/80 shadow-xs',
  sub: 'sub-card rounded-xl border border-surface-200/70 dark:border-surface-800/70',
  elevated:
    'bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-lg',
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/** Builds the surface classes shared by `pantry-card` and the `[pantryCard]` directive. */
export function cardSurfaceClasses(
  variant: CardVariant,
  padding: CardPadding,
  hover: boolean,
): string {
  const hoverClass = hover ? 'sub-card-hover cursor-pointer' : '';
  return `${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${hoverClass} transition-all duration-200`;
}
