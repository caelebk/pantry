import { CommonModule } from "@angular/common";
import { Component, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Category } from "@models/category.model";
import { NutrientGroup } from "@models/inventory.models";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { Item } from "@models/items.model";
import { NutrientGroupComponent } from "../nutrient-group/nutrient-group.component";

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
    NutrientGroupComponent,
  ],
  templateUrl: "./ingredient-group-container.component.html",
})
export class IngredientGroupContainerComponent {
  // Inputs
  nutrientGroups = input.required<NutrientGroup[]>();
  categories = input.required<Category[]>();
  searchQuery = input<string>("");
  selectedCategory = input<Category | null>(null);

  // Outputs
  searchChange = output<string>();
  categorySelect = output<Category | null>();
  unassignItem = output<Item>();

  // Local State
  selectedNutrientTypeId = signal<number | null>(null);
  expandedNutrientGroups = signal<Set<number>>(new Set());
  expandedCategories = signal<Set<number>>(new Set());
  expandedIngredients = signal<Set<string>>(new Set());

  selectNutrientType(id: number | null) {
    if (this.selectedNutrientTypeId() === id) {
      this.selectedNutrientTypeId.set(null);
    } else {
      this.selectedNutrientTypeId.set(id);
    }
  }

  get filteredNutrientGroups(): NutrientGroup[] {
    const selectedNt = this.selectedNutrientTypeId();
    const groups = this.nutrientGroups();
    if (!selectedNt) return groups;
    return groups.filter((ng) => ng.nutrientType.id === selectedNt);
  }

  // Event Handlers
  onSearch(query: string) {
    this.searchChange.emit(query);
  }

  onCategorySelect(category: Category | null) {
    this.categorySelect.emit(category);
  }

  onToggleNutrientGroup(nutrientTypeId: number) {
    this.expandedNutrientGroups.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(nutrientTypeId)) {
        newSet.delete(nutrientTypeId);
      } else {
        newSet.add(nutrientTypeId);
      }
      return newSet;
    });
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
  isNutrientGroupExpanded(nutrientTypeId: number): boolean {
    return this.expandedNutrientGroups().has(nutrientTypeId);
  }

  expandAll() {
    const allNtIds = new Set(this.nutrientGroups().map((ng) => ng.nutrientType.id));
    const allCatIds = new Set(
      this.nutrientGroups().flatMap((ng) => ng.categoryGroups.map((cg) => cg.category.id))
    );
    this.expandedNutrientGroups.set(allNtIds);
    this.expandedCategories.set(allCatIds);
  }

  collapseAll() {
    this.expandedNutrientGroups.set(new Set());
    this.expandedCategories.set(new Set());
    this.expandedIngredients.set(new Set());
  }
}
