import { CommonModule } from '@angular/common';
import { Component, Output, computed, input, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { getTimeDifferenceString, isExpired, itemProgress } from '@utility/itemUtility/ItemUtility';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Subject } from 'rxjs';

import { EditItemFormComponent } from '../edit-item-form/edit-item-form.component';

@Component({
  selector: 'item-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule, DialogModule, ButtonModule, EditItemFormComponent],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class ItemCardComponent {
  item = input.required<Item>();
  units = input.required<Unit[]>();
  locations = input.required<Location[]>();

  @Output() delete = new Subject<void>();
  @Output() update = new Subject<Item>();

  public expired = computed(() => isExpired(this.item()));
  public itemProgress = computed(() => itemProgress(this.item()));
  public timeRemaining = computed(() =>
    getTimeDifferenceString(new Date(), this.item().expirationDate),
  );

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
