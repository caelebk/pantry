import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientGroup } from '@models/ingredient-group.model';
import { IngredientCategoryCluster, IngredientGroupCluster } from '@models/inventory.models';
import { Item } from '@models/items.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { NutrientGroupComponent } from '../nutrient-group/nutrient-group.component';

@Component({
  selector: 'pantry-ingredient-group-container',
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
  templateUrl: './ingredient-group-container.component.html',
})
export class IngredientGroupContainerComponent {
  // Inputs
  nutrientGroups = input.required<IngredientCategoryCluster[]>();
  categories = input.required<IngredientGroup[]>();
  searchQuery = input<string>('');
  selectedCategory = input<IngredientGroup | null>(null);

  // Outputs
  searchChange = output<string>();
  categorySelect = output<IngredientGroup | null>();
  unassignItem = output<Item>();

  // Local State
  selectedNutrientTypeIds = signal<number[]>([]);
  selectedCategoryIds = signal<number[]>([]);
  expandedNutrientGroups = signal<Set<number>>(new Set());
  expandedCategories = signal<Set<number>>(new Set());
  expandedIngredients = signal<Set<string>>(new Set());

  // Computed options for the dropdowns
  nutrientSelectOptions = computed<{ id: number; name: string; icon: string }[]>(() => {
    return this.nutrientGroups().map((ng) => {
      const cat = ng.category || ng.nutrientType;
      return {
        id: cat ? cat.id : -1,
        name: cat ? cat.name : 'Unknown',
        icon: cat && cat.icon ? cat.icon : '📦',
      };
    });
  });

  categoryGroupOptions = computed<{ id: number; name: string; icon: string }[]>(() => {
    return this.categories().map((c) => ({
      id: c.id,
      name: c.name,
      icon: '🏷️',
    }));
  });

  onNutrientTypesSelect(ids: number[] | null) {
    this.selectedNutrientTypeIds.set(ids ?? []);
  }

  onCategoryIdsSelect(ids: number[] | null) {
    this.selectedCategoryIds.set(ids ?? []);
  }

  getNutrientName(itemOrId: any): string {
    if (itemOrId == null) return '';
    if (typeof itemOrId === 'object') {
      return itemOrId.name || itemOrId.label || '';
    }
    const option = this.nutrientSelectOptions().find((opt) => opt.id === itemOrId);
    return option ? option.name : '';
  }

  getNutrientIcon(itemOrId: any): string {
    if (itemOrId == null) return '✨';
    if (typeof itemOrId === 'object' && itemOrId.icon) {
      return itemOrId.icon;
    }
    const option = this.nutrientSelectOptions().find(
      (opt) => opt.id === (typeof itemOrId === 'object' ? itemOrId.id : itemOrId),
    );
    return option ? option.icon : '✨';
  }

  getCategoryName(itemOrId: any): string {
    if (itemOrId == null) return '';
    if (typeof itemOrId === 'object') {
      return itemOrId.name || itemOrId.label || '';
    }
    const option = this.categoryGroupOptions().find((opt) => opt.id === itemOrId);
    return option ? option.name : '';
  }

  get filteredNutrientGroups(): IngredientCategoryCluster[] {
    const selectedNtIds = this.selectedNutrientTypeIds();
    const selectedCatIds = this.selectedCategoryIds();
    let groups = this.nutrientGroups();

    if (selectedNtIds && selectedNtIds.length > 0) {
      groups = groups.filter((ng) => {
        const cat = ng.category || ng.nutrientType;
        return cat && selectedNtIds.includes(cat.id);
      });
    }

    if (selectedCatIds && selectedCatIds.length > 0) {
      groups = groups
        .map((ng) => {
          const catGroups = ng.ingredientGroups || ng.categoryGroups || [];
          const filtered = catGroups.filter((cg) => {
            const grp = cg.group || cg.category;
            return grp && selectedCatIds.includes(grp.id);
          });
          return {
            ...ng,
            ingredientGroups: filtered,
            categoryGroups: filtered,
          };
        })
        .filter((ng) => (ng.ingredientGroups || ng.categoryGroups || []).length > 0);
    }

    return groups;
  }

  // Event Handlers
  onSearch(query: string) {
    this.searchChange.emit(query);
  }

  onCategorySelect(category: IngredientGroup | null) {
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
  getCategoryId(ng: IngredientCategoryCluster): number {
    const cat = ng.category || ng.nutrientType;
    return cat ? cat.id : -1;
  }

  isNutrientGroupExpanded(nutrientTypeId: number): boolean {
    return this.expandedNutrientGroups().has(nutrientTypeId);
  }

  expandAll() {
    const allNtIds = new Set(
      this.nutrientGroups().map((ng) => {
        const cat = ng.category || ng.nutrientType;
        return cat ? cat.id : -1;
      }),
    );
    const allCatIds = new Set(
      this.nutrientGroups().flatMap((ng) => {
        const catGroups = ng.ingredientGroups || ng.categoryGroups || [];
        return catGroups.map((cg) => {
          const grp = cg.group || cg.category;
          return grp ? grp.id : -1;
        });
      }),
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
