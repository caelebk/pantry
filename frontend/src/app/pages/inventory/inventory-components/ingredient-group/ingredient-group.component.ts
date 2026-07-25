import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { Router } from "@angular/router";
import { IngredientGroup } from "@models/inventory.models";
import { IngredientRowComponent } from "../ingredient-row/ingredient-row.component";

@Component({
  selector: "pantry-ingredient-group",
  standalone: true,
  imports: [CommonModule, IngredientRowComponent],
  templateUrl: "./ingredient-group.component.html",
})
export class IngredientGroupComponent {
  private readonly router = inject(Router);

  @Input({ required: true })
  group!: IngredientGroup;
  @Input({ required: true })
  isExpanded!: boolean;
  @Input()
  expandedIngredients: Set<string> = new Set();

  @Output()
  toggle = new EventEmitter<number>();
  @Output()
  toggleIngredient = new EventEmitter<string>();

  navigateToEdit(itemId: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/inventory', itemId, 'edit']);
  }

  isIngredientExpanded(id: string): boolean {
    return this.expandedIngredients.has(id);
  }

  onToggleIngredient(id: string) {
    this.toggleIngredient.emit(id);
  }
}
