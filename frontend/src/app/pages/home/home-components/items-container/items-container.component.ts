import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  Output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme, ItemTimeStatus } from '@models/items.model';
import { BadgeComponent, EmptyStateComponent } from '@ui';
import { getItemTimeStatus, sortItemsByExpirationDate } from '@utility/itemUtility/ItemUtility';

@Component({
  selector: 'pantry-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule, BadgeComponent, EmptyStateComponent, RouterLink],
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsContainerComponent {
  readonly maxVisibleItems = 4;

  items = input.required<Item[]>();
  titleKey = input.required<string>();
  theme = input<ItemsContainerTheme>(ItemsContainerTheme.Gray);
  footerMessageKey = input.required<string>();

  @Output() removeItem = new EventEmitter<Item>();

  visibleItems = computed(() => {
    const sortedItems = sortItemsByExpirationDate(this.items());
    return sortedItems.slice(0, this.maxVisibleItems);
  });

  hiddenItemsCount = computed(() => Math.max(0, this.items().length - this.maxVisibleItems));
  getItemTimeDifference(item: Item): ItemTimeStatus {
    return getItemTimeStatus(item);
  }

  onRemoveItem(item: Item, event: MouseEvent): void {
    event.stopPropagation();
    this.removeItem.emit(item);
  }
}
