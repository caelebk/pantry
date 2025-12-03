import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '../../../../models/items.model';

@Component({
  selector: 'expired-items-container',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './expired-items-container.component.html',
})
export class ExpiredItemsContainerComponent {
  @Input() expiredItems: Item[] = [];
}
