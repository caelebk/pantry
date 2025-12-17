import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '../../../../models/items.model';

@Component({
  selector: 'pantry-expired-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './expired-items-container.component.html',
  styleUrls: ['./expired-items-container.component.scss'],
})
export class ExpiredItemsContainerComponent implements OnInit, OnChanges {
  @Input() expiredItems: Item[] = [];
  readonly maxExpiredItems = 2;

  visibleExpiredItems: Item[] = [];
  isExpanded = false;

  get hiddenItemsCount(): number {
    return this.expiredItems.length - this.maxExpiredItems;
  }

  get showToggle(): boolean {
    return this.expiredItems.length > this.maxExpiredItems;
  }

  ngOnInit() {
    this.updateVisibleItems();
  }

  ngOnChanges() {
    this.updateVisibleItems();
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.updateVisibleItems();
  }

  updateVisibleItems() {
    if (this.isExpanded) {
      this.visibleExpiredItems = this.expiredItems;
    } else {
      this.visibleExpiredItems = this.expiredItems.slice(0, this.maxExpiredItems);
    }
  }
}
