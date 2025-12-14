import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '../../../../models/items.model';

@Component({
  selector: 'expired-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './expired-items-container.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ExpiredItemsContainerComponent implements OnInit {
  @Input() expiredItems: Item[] = [];
  readonly maxExpiredItems = 2;

  visibleExpiredItems: Item[] = [];
  expiredItemsCount: number = 0;
  hiddenItemsCount: number = 0;
  hiddenItemsMessage: string = '';

  ngOnInit() {
    this.expiredItemsCount = this.expiredItems.length;
    this.hiddenItemsCount = this.expiredItemsCount - this.maxExpiredItems;
    this.hiddenItemsMessage =
      this.hiddenItemsCount > 0 ? `+${this.hiddenItemsCount} more expired items` : '';
    this.visibleExpiredItems = this.expiredItems.slice(0, this.maxExpiredItems);
  }
}
