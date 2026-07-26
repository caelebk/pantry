import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientGroup } from '@models/category.model';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { CategoryService } from '@services/inventory/category.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { ToastService } from '@services/toast.service';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-ingredients-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './ingredients-page.component.html',
})
export class IngredientsPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ingredientService = inject(IngredientService);
  private readonly categoryService = inject(CategoryService);
  private readonly itemService = inject(ItemService);
  private readonly toastService = inject(ToastService);

  public ingredients = signal<Ingredient[]>([]);
  public items = signal<Item[]>([]);
  public ingredientGroups = signal<IngredientGroup[]>([]);
  public isLoading = signal<boolean>(true);
  public searchQuery = signal<string>('');
  public selectedGroup = signal<IngredientGroup | null>(null);

  public filteredIngredients = computed(() => {
    const list = this.ingredients();
    const query = this.searchQuery().toLowerCase().trim();
    const group = this.selectedGroup();

    return list.filter((ing) => {
      const matchesSearch = !query || ing.name.toLowerCase().includes(query);
      const matchesGroup = !group || ing.ingredientGroup?.id === group.id;
      return matchesSearch && matchesGroup;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    this.categoryService.getIngredientGroups().subscribe({
      next: (groups) => this.ingredientGroups.set(groups),
    });

    this.itemService.getItems().subscribe({
      next: (items) => this.items.set(items),
    });

    this.ingredientService.getIngredients().subscribe({
      next: (ings) => {
        this.ingredients.set(ings);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load ingredients:', err);
        this.toastService.showError('Unable to load ingredients catalog.');
        this.isLoading.set(false);
      },
    });
  }

  getConnectedItems(ingredientId: string): Item[] {
    return this.items().filter((item) => item.ingredientId === ingredientId);
  }

  onAddIngredient(): void {
    this.router.navigate(['/inventory/ingredients/new']);
  }

  onEditIngredient(ing: Ingredient): void {
    this.router.navigate(['/inventory/ingredients', ing.id, 'edit']);
  }

  onDeleteIngredient(ing: Ingredient): void {
    if (confirm(`Are you sure you want to delete "${ing.name}" from the master ingredients catalog?`)) {
      this.ingredientService.deleteIngredient(ing.id).subscribe({
        next: () => {
          this.toastService.showSuccess(`Master Ingredient "${ing.name}" deleted.`);
          this.loadData();
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.toastService.showError('Failed to delete ingredient. It may have items associated with it.');
        },
      });
    }
  }
}
