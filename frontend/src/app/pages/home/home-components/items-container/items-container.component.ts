import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, EventEmitter, inject, input, Output, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Item, ItemsContainerTheme, ItemTimeStatus } from '@models/items.model';
import { STAGGER_DELAY_PER_ITEM_MS, staggeredFadeIn } from '@utility/animationUtility/animations';
import { getItemTimeStatus, sortItemsByExpirationDate } from '@utility/itemUtility/ItemUtility';

@Component({
  selector: 'pantry-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './items-container.component.html',
  styleUrls: ['./items-container.component.scss'],
  animations: [staggeredFadeIn],
  host: { class: 'block' },
})
export class ItemsContainerComponent {
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private readonly delayMs = 100;

  @ViewChild('itemsList') itemsListElement?: ElementRef<HTMLDivElement>;

  readonly Theme = ItemsContainerTheme;
  readonly maxVisibleItems = 4;
  readonly staggerDelayPerItemMs = STAGGER_DELAY_PER_ITEM_MS;

  items = input.required<Item[]>();
  titleKey = input.required<string>();
  theme = input<ItemsContainerTheme>(ItemsContainerTheme.Gray);
  footerMessageKey = input.required<string>();
  isExpanded = signal(false);

  @Output() removeItem = new EventEmitter<Item>();

  visibleItems = computed(() => {
    const sortedItems = sortItemsByExpirationDate(this.items());
    if (this.isExpanded()) {
      return sortedItems;
    }
    return sortedItems.slice(0, this.maxVisibleItems);
  });

  hiddenItemsCount = computed(() => Math.max(0, this.items().length - this.maxVisibleItems));
  showToggle = computed(() => this.items().length > this.maxVisibleItems);

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);

    if (this.isExpanded()) {
      setTimeout(() => {
        this.elementRef.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, this.delayMs);
    } else {
      if (this.itemsListElement) {
        this.itemsListElement.nativeElement.scrollTop = 0;
      }
    }
  }

  getItemTimeDifference(item: Item): ItemTimeStatus {
    return getItemTimeStatus(item);
  }

  onEditItem(item: Item, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/inventory', item.id, 'edit']);
  }

  onRemoveItem(item: Item, event: MouseEvent): void {
    event.stopPropagation();
    this.removeItem.emit(item);
  }
}
