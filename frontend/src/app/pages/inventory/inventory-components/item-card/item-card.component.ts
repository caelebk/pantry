import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '../../../../models/items.model';
import { isExpired, itemProgress } from '../../../../utility/itemUtility';

@Component({
  selector: 'item-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; }']
})
export class ItemCardComponent {
  @Input() item?: Item;

  expired: boolean = false;
  itemProgress: number = 0;

  ngOnInit(): void {
    if (this.item) {
      this.expired = isExpired(this.item);
      this.itemProgress = itemProgress(this.item);
    }
  }
}
