import { CommonModule } from '@angular/common';
import { Component, inject, Output, computed, input, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { getTimeDifferenceString, isExpired, isExpiringSoon, itemProgress } from '@utility/itemUtility/ItemUtility';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Subject } from 'rxjs';

import { Router } from '@angular/router';

@Component({
  selector: 'pantry-item-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule, DialogModule, ButtonModule],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class ItemCardComponent {
  private readonly router = inject(Router);

  item = input.required<Item>();
  units = input.required<Unit[]>();
  locations = input.required<Location[]>();

  @Output() delete = new Subject<void>();
  @Output() update = new Subject<Item>();

  public expired = computed(() => isExpired(this.item()));
  public expiringSoon = computed(() => isExpiringSoon(this.item()));
  public itemProgress = computed(() => itemProgress(this.item()));
  public timeRemaining = computed(() =>
    getTimeDifferenceString(new Date(), this.item().expirationDate),
  );

  public displayNoteDialog = signal(false);

  showNote() {
    this.displayNoteDialog.set(true);
  }

  showEdit(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/inventory', this.item().id, 'edit']);
  }
}
