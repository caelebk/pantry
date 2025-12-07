import { Component, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Item } from '../../../../models/items.model';
import { getTimeDifferenceString, isExpired, itemProgress } from '../../../../utility/itemUtility';
import { Subject } from 'rxjs';

import { EditItemFormComponent } from '../edit-item-form/edit-item-form.component';

@Component({
  selector: 'item-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule, DialogModule, ButtonModule, EditItemFormComponent],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; height: 100%; }']
})
export class ItemCardComponent {
  @Input() item!: Item;
  @Output() delete = new Subject<void>();
  @Output() update = new Subject<Item>();

  public expired: boolean = false;
  public itemProgress: number = 0;
  public timeRemaining: string = '';
  public displayNoteDialog: boolean = false;
  public displayEditDialog: boolean = false;

  showNote() {
    this.displayNoteDialog = true;
  }
  
  showEdit() {
    this.displayEditDialog = true;
  }

  onEditItem(updatedItem: Item) {
    this.update.next(updatedItem);
    this.displayEditDialog = false;
  }

  ngOnInit(): void {
    this.expired = isExpired(this.item);
    this.itemProgress = itemProgress(this.item);
    this.timeRemaining = getTimeDifferenceString(new Date(), this.item.bestBeforeDate); 
  }
}
