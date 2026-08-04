import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import {
  getTimeDifferenceString,
  isExpired,
  isExpiringSoon,
  itemProgress,
} from '@utility/itemUtility/ItemUtility';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Subject } from 'rxjs';

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
  ingredients = input<Ingredient[]>([]);

  @Output() delete = new Subject<void>();
  @Output() update = new Subject<Item>();

  public expired = computed(() => isExpired(this.item()));
  public expiringSoon = computed(() => isExpiringSoon(this.item()));
  public itemProgress = computed(() => itemProgress(this.item()));
  public timeRemaining = computed(() => {
    const exp = this.item().expirationDate;
    return exp ? getTimeDifferenceString(new Date(), exp) : 'No Expiration';
  });

  public ingredientName = computed(() => {
    const ingId = this.item().ingredientId;
    if (!ingId) return null;
    const found = this.ingredients().find((i) => i.id === ingId);
    return found ? found.name : null;
  });

  public displayNoteDialog = signal(false);

  showNote() {
    this.displayNoteDialog.set(true);
  }

  showEdit(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/inventory/items', this.item().id, 'edit']);
  }
}
