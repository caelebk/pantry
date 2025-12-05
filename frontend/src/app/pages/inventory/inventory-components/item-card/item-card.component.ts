import { Component, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '../../../../models/items.model';
import { getTimeDifferenceString, isExpired, itemProgress } from '../../../../utility/itemUtility';
import { Subject } from 'rxjs';

@Component({
  selector: 'item-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; }']
})
export class ItemCardComponent {
  @Input() item?: Item;
  @Output() delete = new Subject<void>();

  expired: boolean = false;
  itemProgress: number = 0;
  timeRemaining: string = '';

  ngOnInit(): void {
    if (this.item) {
      this.expired = isExpired(this.item);
      this.itemProgress = itemProgress(this.item);
      this.timeRemaining = getTimeDifferenceString(new Date(), this.item.bestBeforeDate); 
    }
  }
}
