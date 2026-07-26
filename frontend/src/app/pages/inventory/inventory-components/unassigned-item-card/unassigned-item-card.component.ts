import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnrichedIngredient, IngredientGroup } from '@models/inventory.models';
import { Item } from '@models/items.model';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-unassigned-item-card',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  templateUrl: './unassigned-item-card.component.html',
})
export class UnassignedItemCardComponent {
  @Input({ required: true })
  item!: Item;
  @Input({ required: true })
  categoryGroups!: IngredientGroup[];

  @Output()
  assign = new EventEmitter<{ item: Item; ingredient: EnrichedIngredient }>();

  get suggestedIngredient(): EnrichedIngredient | null {
    if (!this.item || !this.item.name || !this.categoryGroups) return null;
    const itemName = this.item.name.toLowerCase().trim();

    for (const group of this.categoryGroups) {
      for (const ing of group.ingredients) {
        const ingName = ing.name.toLowerCase().trim();
        if (itemName.includes(ingName) || ingName.includes(itemName)) {
          return ing;
        }
      }
    }
    return null;
  }

  onAssign(ingredient: EnrichedIngredient) {
    if (ingredient) {
      this.assign.emit({ item: this.item, ingredient });
    }
  }
}
