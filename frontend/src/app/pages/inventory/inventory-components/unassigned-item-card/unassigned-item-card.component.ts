import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { EnrichedIngredient, IngredientGroup } from "@models/inventory.models";
import { Item } from "@models/items.model";
import { SelectModule } from "primeng/select";

@Component({
  selector: "pantry-unassigned-item-card",
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  templateUrl: "./unassigned-item-card.component.html",
})
export class UnassignedItemCardComponent {
  @Input({ required: true })
  item!: Item;
  @Input({ required: true })
  categoryGroups!: IngredientGroup[];

  @Output()
  assign = new EventEmitter<{ item: Item; ingredient: EnrichedIngredient }>();

  onAssign(ingredient: EnrichedIngredient) {
    if (ingredient) {
      this.assign.emit({ item: this.item, ingredient });
    }
  }
}
