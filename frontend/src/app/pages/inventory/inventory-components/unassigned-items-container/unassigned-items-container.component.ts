import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnrichedIngredient, IngredientGroup } from '@models/inventory.models';
import { Item } from '@models/items.model';

@Component({
  selector: 'pantry-unassigned-items-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unassigned-items-container.component.html',
})
export class UnassignedItemsContainerComponent {
  // Inputs
  unassignedItems = input.required<Item[]>();
  categoryGroups = input.required<IngredientGroup[]>();
  loading = input<boolean>(false);

  // Outputs
  assignItem = output<{ item: Item; ingredient: EnrichedIngredient }>();
  switchToGroupsTab = output<void>();

  // State
  selectedItemId = signal<string | null>(null);
  targetSearchQuery = signal<string>('');

  // Computed Active Item
  activeSelectedItem = computed<Item | null>(() => {
    const items = this.unassignedItems();
    if (items.length === 0) return null;
    const currentId = this.selectedItemId();
    if (!currentId) return items[0];
    return items.find((i) => i.id === currentId) || items[0];
  });

  // Computed Filtered Target Taxonomy Categories
  filteredCategoryGroups = computed<IngredientGroup[]>(() => {
    const query = this.targetSearchQuery().toLowerCase().trim();
    const groups = this.categoryGroups();
    if (!query) return groups;

    return groups
      .map((g) => {
        const matchesCategory = g.category.name.toLowerCase().includes(query);
        const matchingIngredients = g.ingredients.filter((ing) =>
          ing.name.toLowerCase().includes(query),
        );

        if (matchesCategory) {
          return g; // keep all ingredients in matching category
        } else if (matchingIngredients.length > 0) {
          return { ...g, ingredients: matchingIngredients };
        }
        return null;
      })
      .filter((g): g is IngredientGroup => g !== null);
  });

  selectItem(item: Item) {
    this.selectedItemId.set(item.id);
  }

  getSuggestedIngredient(item: Item | null): EnrichedIngredient | null {
    if (!item || !item.name) return null;
    const itemName = item.name.toLowerCase().trim();

    for (const group of this.categoryGroups()) {
      for (const ing of group.ingredients) {
        const ingName = ing.name.toLowerCase().trim();
        if (itemName.includes(ingName) || ingName.includes(itemName)) {
          return ing;
        }
      }
    }
    return null;
  }

  assignActiveItemToIngredient(ingredient: EnrichedIngredient) {
    const active = this.activeSelectedItem();
    if (!active) return;

    this.assignItem.emit({ item: active, ingredient });

    // Automatically select the next unassigned item in queue
    const items = this.unassignedItems();
    const currentIndex = items.findIndex((i) => i.id === active.id);
    if (currentIndex >= 0 && items.length > 1) {
      const nextItem = items[currentIndex + 1] || items[0];
      this.selectedItemId.set(nextItem.id);
    }
  }

  onAssignItemCard(event: { item: Item; ingredient: EnrichedIngredient }) {
    this.assignItem.emit(event);
  }

  onGoToGroups() {
    this.switchToGroupsTab.emit();
  }
}
