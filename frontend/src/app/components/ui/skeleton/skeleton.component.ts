import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'card' | 'row' | 'text' | 'circle' | 'custom';

@Component({
  selector: 'pantry-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3 w-full" aria-busy="true" aria-label="Loading content">
      @for (item of items(); track item) {
        @switch (variant()) {
          @case ('card') {
            <div
              class="glass-card animate-pulse rounded-2xl border border-surface-200/80 dark:border-surface-800/80 bg-surface-100/50 dark:bg-surface-800/40"
              [style.height]="height() || '120px'"
              [style.width]="width() || '100%'"></div>
          }
          @case ('row') {
            <div
              class="h-12 w-full animate-pulse rounded-xl bg-surface-200/60 dark:bg-surface-800/60 border border-surface-200/40 dark:border-surface-700/40"></div>
          }
          @case ('text') {
            <div
              class="h-4 animate-pulse rounded-md bg-surface-200/80 dark:bg-surface-700/80"
              [style.width]="width() || '75%'"></div>
          }
          @case ('circle') {
            <div
              class="animate-pulse rounded-full bg-surface-200/80 dark:bg-surface-700/80"
              [style.height]="height() || '40px'"
              [style.width]="width() || '40px'"></div>
          }
          @case ('custom') {
            <div
              class="animate-pulse rounded-xl bg-surface-200/60 dark:bg-surface-800/60"
              [style.height]="height()"
              [style.width]="width() || '100%'"></div>
          }
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('card');
  height = input<string>();
  width = input<string>();
  count = input<number>(1);

  items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
