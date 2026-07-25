import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EnrichedIngredient } from "@models/inventory.models";

@Component({
  selector: "pantry-ingredient-row",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./ingredient-row.component.html",
})
export class IngredientRowComponent {
  @Input({ required: true })
  ingredient!: EnrichedIngredient;
  @Input({ required: true })
  categoryName!: string;
  @Input()
  isExpanded: boolean = false;

  @Output()
  toggleExpand = new EventEmitter<string>();
}
