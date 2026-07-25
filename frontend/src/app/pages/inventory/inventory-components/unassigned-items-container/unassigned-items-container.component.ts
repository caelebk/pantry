import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { EnrichedIngredient, IngredientGroup } from "@models/inventory.models";
import { Item } from "@models/items.model";
import { UnassignedItemCardComponent } from "../unassigned-item-card/unassigned-item-card.component";

@Component({
  selector: "pantry-unassigned-items-container",
  standalone: true,
  imports: [CommonModule, UnassignedItemCardComponent],
  templateUrl: "./unassigned-items-container.component.html",
})
export class UnassignedItemsContainerComponent {
  // Inputs
  unassignedItems = input.required<Item[]>();
  categoryGroups = input.required<IngredientGroup[]>();
  loading = input<boolean>(false);

  // Outputs
  assignItem = output<{ item: Item; ingredient: EnrichedIngredient }>();

  // Event Handlers
  onAssignItem(event: { item: Item; ingredient: EnrichedIngredient }) {
    this.assignItem.emit(event);
  }
}
