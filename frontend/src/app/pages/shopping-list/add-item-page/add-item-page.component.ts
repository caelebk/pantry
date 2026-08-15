import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { ShoppingItem } from '@models/shopping-list.model';
import { Store } from '@models/store.model';
import { Unit } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { StoreService } from '@services/store.service';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'pantry-add-shopping-item-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
  ],
  templateUrl: './add-item-page.component.html',
  styleUrl: './add-item-page.component.scss',
})
export class AddShoppingItemPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly shoppingListService = inject(ShoppingListService);
  private readonly ingredientService = inject(IngredientService);
  private readonly ingredientGroupService = inject(IngredientGroupService);
  private readonly unitService = inject(UnitService);
  private readonly storeService = inject(StoreService);

  readonly ingredients = signal<Ingredient[]>([]);
  readonly groups = signal<IngredientGroup[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly selectedIngredient = signal<Ingredient | null>(null);
  readonly selectedStore = signal<Store | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly name = signal('');
  readonly quantity = signal(1);
  readonly estimatedPrice = signal<number | null>(null);
  readonly storeName = signal('');
  readonly storeId = signal<string | undefined>(undefined);
  readonly isCreatingIngredient = signal(false);
  readonly newIngredientName = signal('');
  readonly newIngredientGroupId = signal<number | null>(null);
  readonly newIngredientUnitId = signal<number | null>(null);
  readonly isCreatingStore = signal(false);
  readonly newStoreName = signal('');
  readonly isSavingStore = signal(false);
  readonly error = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly duplicateItem = signal<ShoppingItem | null>(null);

  ngOnInit(): void {
    this.ingredientService.getIngredients().subscribe((items) => this.ingredients.set(items));
    this.ingredientGroupService
      .getIngredientGroups()
      .subscribe((groups) => this.groups.set(groups));
    this.unitService.getUnits().subscribe((units) => this.units.set(units));
    this.storeService
      .getStores()
      .subscribe((stores) => this.stores.set(stores.filter((store) => !store.archived)));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.shoppingListService.getItem(id).subscribe({
        next: (item) => this.populate(item),
        error: () => this.error.set('Shopping item could not be loaded.'),
      });
    }
  }

  selectIngredient(ingredient: Ingredient | null): void {
    this.selectedIngredient.set(ingredient);
    if (ingredient) this.name.set(ingredient.name);
  }

  populate(item: ShoppingItem): void {
    this.name.set(item.name);
    this.quantity.set(item.quantity);
    this.estimatedPrice.set(item.estimatedPrice ?? null);
    this.storeName.set(item.storeName || '');
    this.storeId.set(item.storeId);
    const ingredient = this.ingredients().find((candidate) => candidate.id === item.ingredientId);
    if (ingredient) this.selectedIngredient.set(ingredient);
    const store = this.stores().find((s) => s.id === item.storeId || s.name === item.storeName);
    if (store) this.selectedStore.set(store);
  }

  toggleIngredientCreation(): void {
    this.isCreatingIngredient.update((value) => !value);
    this.newIngredientName.set(this.name());
  }

  createIngredient(): void {
    const name = this.newIngredientName().trim();
    const groupId = this.newIngredientGroupId();
    const unitId = this.newIngredientUnitId();
    if (!name || !groupId || !unitId) {
      this.error.set('Ingredient name, group, and default unit are required.');
      return;
    }
    this.ingredientService
      .createIngredient({ name, ingredientGroupId: groupId, defaultUnitId: unitId })
      .subscribe({
        next: (created) => {
          this.ingredientService.getIngredients().subscribe((items) => {
            this.ingredients.set(items);
            this.selectIngredient(items.find((item) => item.id === created.id) || null);
            this.isCreatingIngredient.set(false);
          });
        },
        error: () => this.error.set('Unable to create ingredient.'),
      });
  }

  toggleStoreCreation(): void {
    this.isCreatingStore.update((v) => !v);
    this.newStoreName.set('');
  }

  createStore(): void {
    const name = this.newStoreName().trim();
    if (!name) return;

    this.isSavingStore.set(true);
    this.storeService.createStore(name).subscribe({
      next: (created) => {
        this.isSavingStore.set(false);
        this.storeService.getStores().subscribe((stores) => {
          const activeStores = stores.filter((s) => !s.archived);
          this.stores.set(activeStores);
          const found = activeStores.find((s) => s.id === created.id) || created;
          this.onStoreSelect(found);
          this.isCreatingStore.set(false);
          this.newStoreName.set('');
        });
      },
      error: () => {
        this.isSavingStore.set(false);
        this.error.set('Unable to create store.');
      },
    });
  }

  onStoreSelect(store: Store | null): void {
    this.selectedStore.set(store);
    this.storeName.set(store?.name || '');
    this.storeId.set(store?.id);
  }

  saveItem(): void {
    const ingredient = this.selectedIngredient();
    if (!ingredient) {
      this.error.set('Select an ingredient before saving.');
      return;
    }
    if (this.quantity() <= 0) {
      this.error.set('Quantity must be greater than zero.');
      return;
    }
    this.error.set(null);
    this.duplicateItem.set(null);
    this.isSaving.set(true);

    const store = this.selectedStore();
    const dto = {
      ingredientId: ingredient.id,
      name: ingredient.name,
      category:
        ingredient.ingredientGroup?.ingredientCategoryName ||
        ingredient.ingredientGroup?.name ||
        'General',
      quantity: this.quantity(),
      unit: ingredient.defaultUnit?.shortName || 'pcs',
      estimatedPrice: this.estimatedPrice() ?? 0,
      storeName: store?.name || '',
      storeId: store?.id,
      source: 'manual' as const,
    };

    const request = this.editingId()
      ? this.shoppingListService.updateItem(this.editingId()!, dto)
      : this.shoppingListService.createItem(dto);
    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/shopping-list']);
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err?.status === 409) {
          const existing = this.shoppingListService
            .getItems()
            .find((item) => item.ingredientId === ingredient.id);
          this.duplicateItem.set(existing || null);
          this.error.set('This ingredient is already on your shopping list.');
        } else this.error.set('Unable to save shopping ingredient.');
      },
    });
  }

  openDuplicate(): void {
    const item = this.duplicateItem();
    if (item) this.router.navigate(['/shopping-list', item.id, 'edit']);
  }

  increaseDuplicateQuantity(): void {
    const item = this.duplicateItem();
    if (!item) return;
    this.shoppingListService
      .updateItem(item.id, { quantity: item.quantity + this.quantity() })
      .subscribe({
        next: () => this.router.navigate(['/shopping-list']),
        error: () => this.error.set('Unable to update the existing shopping item.'),
      });
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
