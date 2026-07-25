import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Category } from "@models/category.model";
import { NutrientGroup } from "@models/inventory.models";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelectModule } from "primeng/multiselect";
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
    MultiSelectModule,
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
  selectedNutrientTypeIds = signal<number[]>([]);
  selectedCategoryIds = signal<number[]>([]);
  expandedNutrientGroups = signal<Set<number>>(new Set());
  expandedCategories = signal<Set<number>>(new Set());
  expandedIngredients = signal<Set<string>>(new Set());

  // Computed options for the dropdowns
  nutrientSelectOptions = computed<{ id: number; name: string; icon: string }[]>(() => {
    return this.nutrientGroups().map((ng) => ({
      id: ng.nutrientType.id,
      name: ng.nutrientType.name,
      icon: ng.nutrientType.icon || "📦",
    }));
  });

  categoryGroupOptions = computed<{ id: number; name: string; icon: string }[]>(() => {
    return this.categories().map((c) => ({
      id: c.id,
      name: c.name,
      icon: "🏷️",
    }));
  });

  onNutrientTypesSelect(ids: number[] | null) {
    this.selectedNutrientTypeIds.set(ids ?? []);
  }

  onCategoryIdsSelect(ids: number[] | null) {
    this.selectedCategoryIds.set(ids ?? []);
  }

  getNutrientName(itemOrId: any): string {
    if (itemOrId == null) return "";
    if (typeof itemOrId === "object") {
      return itemOrId.name || itemOrId.label || "";
    }
    const option = this.nutrientSelectOptions().find((opt) => opt.id === itemOrId);
    return option ? option.name : "";
  }

  getNutrientIcon(itemOrId: any): string {
    if (itemOrId == null) return "✨";
    if (typeof itemOrId === "object" && itemOrId.icon) {
      return itemOrId.icon;
    }
    const option = this.nutrientSelectOptions().find((opt) => opt.id === (typeof itemOrId === "object" ? itemOrId.id : itemOrId));
    return option ? option.icon : "✨";
  }

  getCategoryName(itemOrId: any): string {
    if (itemOrId == null) return "";
    if (typeof itemOrId === "object") {
      return itemOrId.name || itemOrId.label || "";
    }
    const option = this.categoryGroupOptions().find((opt) => opt.id === itemOrId);
    return option ? option.name : "";
  }

  get filteredNutrientGroups(): NutrientGroup[] {
    const selectedNtIds = this.selectedNutrientTypeIds();
    const selectedCatIds = this.selectedCategoryIds();
    let groups = this.nutrientGroups();

    if (selectedNtIds && selectedNtIds.length > 0) {
      groups = groups.filter((ng) => selectedNtIds.includes(ng.nutrientType.id));
    }

    if (selectedCatIds && selectedCatIds.length > 0) {
      groups = groups
        .map((ng) => ({
          ...ng,
          categoryGroups: ng.categoryGroups.filter((cg) => selectedCatIds.includes(cg.category.id)),
        }))
        .filter((ng) => ng.categoryGroups.length > 0);
    }

    return groups;
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
