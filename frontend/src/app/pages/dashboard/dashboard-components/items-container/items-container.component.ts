import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '../../../../models/items.model';

export enum ItemsContainerTheme {
  Red = 'red',
  Orange = 'orange',
  Gray = 'gray',
  Blue = 'blue',
}

@Component({
  selector: 'pantry-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
})
export class ItemsContainerComponent {
  items = input.required<Item[]>();
  titleKey = input.required<string>();
  theme = input<ItemsContainerTheme>(ItemsContainerTheme.Gray);
  footerMessageKey = input.required<string>();

  // Expose Enum to template
  readonly Theme = ItemsContainerTheme;

  readonly maxVisibleItems = 2;
  isExpanded = signal(false);

  visibleItems = computed(() => {
    if (this.isExpanded()) {
      return this.items();
    }
    return this.items().slice(0, this.maxVisibleItems);
  });

  hiddenItemsCount = computed(() => Math.max(0, this.items().length - this.maxVisibleItems));

  showToggle = computed(() => this.items().length > this.maxVisibleItems);

  toggleExpand() {
    this.isExpanded.update((v) => !v);
  }

  getItemTimeDifference(item: Item): { label: string; isExpired: boolean; isClose: boolean } {
    const diff = this.getTimeDiff(item.expirationDate);
    const label = this.getTimeDiffString(diff);
    const isExpired = diff < 0;
    // Assuming "close" is within 14 days (matching isExpiringSoon utility default)
    const isClose = !isExpired && diff <= 1209600000;

    return { label, isExpired, isClose };
  }

  private getTimeDiff(date: Date): number {
    return new Date(date).getTime() - new Date().getTime();
  }

  private getTimeDiffString(diffMs: number): string {
    const absDiffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const isExpired = diffMs < 0;
    const daysInAYear = 365;
    const daysInAMonth = 30;

    let result: string;

    if (absDiffDays === 0) {
      return isExpired ? 'Expired today' : 'Today';
    }

    if (absDiffDays >= daysInAYear) {
      const years = Math.floor(absDiffDays / daysInAYear);
      result = `${years} year${years > 1 ? 's' : ''}`;
    } else if (absDiffDays >= daysInAMonth) {
      const months = Math.floor(absDiffDays / daysInAMonth);
      result = `${months} month${months > 1 ? 's' : ''}`;
    } else {
      result = `${absDiffDays} day${absDiffDays !== 1 ? 's' : ''}`;
    }

    return isExpired ? `${result} expired` : `${result} left`;
  }
}
