import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme, ItemTimeStatus } from '@models/items.model';
import { getItemTimeStatus } from '@utility/itemUtility/ItemUtility';

@Component({
  selector: 'pantry-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
})
export class ItemsContainerComponent {
  private readonly elementRef = inject(ElementRef);

  items = input.required<Item[]>();
  titleKey = input.required<string>();
  theme = input<ItemsContainerTheme>(ItemsContainerTheme.Gray);
  footerMessageKey = input.required<string>();

  // Expose Enum to template
  readonly Theme = ItemsContainerTheme;

  private readonly delayMs = 100;

  readonly maxVisibleItems = 3;
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

    if (this.isExpanded()) {
      // Small timeout to allow the view to update and the list to expand before scrolling
      setTimeout(() => {
        this.elementRef.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, this.delayMs);
    }
  }

  getItemTimeDifference(item: Item): ItemTimeStatus {
    return getItemTimeStatus(item);
  }
}
