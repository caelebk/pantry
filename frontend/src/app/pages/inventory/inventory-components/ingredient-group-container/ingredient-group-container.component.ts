import { CommonModule } from "@angular/common";
import { Component, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Category } from "@models/category.model";
import { IngredientGroup } from "@models/inventory.models";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { IngredientGroupComponent } from "../ingredient-group/ingredient-group.component";

@Component({
  selector: "pantry-ingredient-group-container",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    IngredientGroupComponent,
  ],
  templateUrl: "./ingredient-group-container.component.html",
})
export class IngredientGroupContainerComponent {
  // Inputs
  categoryGroups = input.required<IngredientGroup[]>();
  categories = input.required<Category[]>();
  searchQuery = input<string>("");
  selectedCategory = input<Category | null>(null);

  // Outputs
  searchChange = output<string>();
  categorySelect = output<Category | null>();

  // Local State
  expandedCategories = signal<Set<number>>(new Set());
  expandedIngredients = signal<Set<string>>(new Set());

  // Event Handlers
  onSearch(query: string) {
    this.searchChange.emit(query);
  }

  onCategorySelect(category: Category | null) {
    this.categorySelect.emit(category);
  }

  onToggleCategory(categoryId: number) {
    this.expandedCategories.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }

  onToggleIngredient(ingredientId: string) {
    this.expandedIngredients.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  }

  // Helpers
  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories().has(categoryId);
  }
}
