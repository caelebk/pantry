import { Component, Output, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Item } from '../../../../models/items.model';
import { getTimeDifferenceString, isExpired, itemProgress } from '../../../../utility/itemUtility/ItemUtility';
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
  item = input.required<Item>();
  @Output() delete = new Subject<void>();
  @Output() update = new Subject<Item>();

  public expired = computed(() => isExpired(this.item()));
  public itemProgress = computed(() => itemProgress(this.item()));
  public timeRemaining = computed(() => getTimeDifferenceString(new Date(), this.item().bestBeforeDate));

  public displayNoteDialog = signal(false);
  public displayEditDialog = signal(false);

  showNote() {
    this.displayNoteDialog.set(true);
  }
  
  showEdit() {
    this.displayEditDialog.set(true);
  }

  onEditItem(updatedItem: Item) {
    this.update.next(updatedItem);
    this.displayEditDialog.set(false);
  }
}
