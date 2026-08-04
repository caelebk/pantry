import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItem, Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { ShoppingItem } from '@models/shopping-list.model';
import { Unit, UnitType } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService, ItemSimilarityCandidate } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RestockDraftItem {
  shoppingId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  expirationDate: Date;
  notes: string;
  included: boolean;
  actionMode: 'update' | 'create';
  matchedItemId: string | null;
  matchCandidates: ItemSimilarityCandidate[];
  bestMatch: ItemSimilarityCandidate | null;
  matchTier: 'exact' | 'similar' | 'none';
  isUnitLocked?: boolean;
}

@Component({
  selector: 'pantry-restock-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, DatePickerModule, InputNumberModule],
  templateUrl: './restock-review-page.component.html',
  styleUrl: './restock-review-page.component.scss',
})
export class RestockReviewPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly itemService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);

  readonly Math = Math;

  readonly defaultLocations = ['Fridge', 'Freezer', 'Pantry Shelf', 'Spice Cabinet', 'Countertop'];
  readonly defaultUnits = [
    'g',
    'kg',
    'ml',
    'L',
    'pcs',
    'pack',
    'can',
    'bottle',
    'box',
    'Gram',
    'Liters',
    'Pcs',
  ];

  readonly draftItems = signal<RestockDraftItem[]>([]);
  readonly isSubmitting = signal<boolean>(false);

  readonly pantryItems = signal<IngredientItem[]>([]);
  readonly availableIngredients = signal<Ingredient[]>([]);
  readonly availableUnits = signal<Unit[]>([]);
  readonly availableLocations = signal<Location[]>([]);

  readonly unitsOptions = signal<string[]>(this.defaultUnits);
  readonly locationsOptions = signal<string[]>(this.defaultLocations);

  constructor() {
    effect(() => {
      const shoppingItems = this.shoppingListService.items();
      if (shoppingItems && this.draftItems().length === 0) {
        this.initDrafts(shoppingItems);
      }
    });
  }

  ngOnInit(): void {
    this.itemService
      .getIngredientItems()
      .pipe(catchError(() => of([])))
      .subscribe((items) => {
        if (items) {
          this.pantryItems.set(items);
          this.reevaluateSimilarityForDrafts();
        }
      });

    this.ingredientService
      .getIngredients()
      .pipe(catchError(() => of([])))
      .subscribe((ingredients) => {
        if (ingredients) {
          this.availableIngredients.set(ingredients);
          this.reevaluateSimilarityForDrafts();
        }
      });

    this.unitService
      .getUnits()
      .pipe(catchError(() => of([])))
      .subscribe((units) => {
        if (units && units.length > 0) {
          this.availableUnits.set(units);
          const names = Array.from(
            new Set([
              ...units.map((u) => u.shortName),
              ...units.map((u) => u.name),
              ...this.defaultUnits,
            ]),
          );
          this.unitsOptions.set(names);
        }
      });

    this.locationService
      .getLocations()
      .pipe(catchError(() => of([])))
      .subscribe((locs) => {
        if (locs && locs.length > 0) {
          this.availableLocations.set(locs);
          const names = Array.from(new Set([...locs.map((l) => l.name), ...this.defaultLocations]));
          this.locationsOptions.set(names);
        }
      });

    const existingItems = this.shoppingListService.items();
    if (existingItems.length > 0) {
      this.initDrafts(existingItems);
    }
  }

  private initDrafts(sourceList: ShoppingItem[]): void {
    const boughtItems = sourceList.filter((i) => i.checked);
    const sourceItems: ShoppingItem[] = boughtItems.length > 0 ? boughtItems : sourceList;

    const defaultExp = new Date(Date.now() + 14 * 86400000);

    const drafts: RestockDraftItem[] = sourceItems.map((item) => {
      const draft: RestockDraftItem = {
        shoppingId: item.id,
        name: item.name,
        category: item.category || 'General',
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        location: this.getDefaultLocationForCategory(item.category),
        expirationDate: defaultExp,
        notes: item.recipeName ? `Restocked for recipe: ${item.recipeName}` : '',
        included: true,
        actionMode: 'create',
        matchedItemId: null,
        matchCandidates: [],
        bestMatch: null,
        matchTier: 'none',
        isUnitLocked: false,
      };

      this.fetchBackendSimilarityForDraft(draft);
      return draft;
    });

    this.draftItems.set(drafts);
  }

  private fetchBackendSimilarityForDraft(draft: RestockDraftItem): void {
    if (!draft.name || !draft.name.trim()) {
      draft.matchCandidates = [];
      draft.bestMatch = null;
      draft.matchedItemId = null;
      draft.matchTier = 'none';
      draft.actionMode = 'create';
      draft.isUnitLocked = false;
      return;
    }

    this.itemService
      .getSimilarIngredientItems(draft.name, 0.45)
      .pipe(catchError(() => of([])))
      .subscribe((candidates) => {
        draft.matchCandidates = candidates;
        if (candidates.length > 0) {
          const best = candidates[0];
          draft.bestMatch = best;
          draft.matchTier = best.tier;
          draft.matchedItemId = best.item.id;
          draft.actionMode = 'update';
          if (best.item.location?.name) {
            draft.location = best.item.location.name;
          }
          this.updateUnitLockForDraft(draft, best.item);
        } else {
          draft.bestMatch = null;
          draft.matchTier = 'none';
          draft.matchedItemId = null;
          draft.actionMode = 'create';
          this.updateUnitLockForDraft(draft, null);
        }
      });
  }

  private updateUnitLockForDraft(draft: RestockDraftItem, item: IngredientItem | null): void {
    const ingredients = this.availableIngredients();
    let linkedIng: Ingredient | undefined;

    if (item?.ingredientId) {
      linkedIng = ingredients.find((i) => i.id === item.ingredientId);
    } else if (draft.name) {
      linkedIng = ingredients.find((i) => i.name.toLowerCase() === draft.name.trim().toLowerCase());
    }

    if (linkedIng?.defaultUnit) {
      draft.unit = linkedIng.defaultUnit.shortName || linkedIng.defaultUnit.name;
      draft.isUnitLocked = true;
    } else if (item?.unit) {
      draft.unit = item.unit.shortName || item.unit.name;
      draft.isUnitLocked = false;
    } else {
      draft.isUnitLocked = false;
    }
  }

  private reevaluateSimilarityForDrafts(): void {
    this.draftItems().forEach((draft) => this.fetchBackendSimilarityForDraft(draft));
  }

  onNameChange(draft: RestockDraftItem): void {
    this.fetchBackendSimilarityForDraft(draft);
  }

  onMatchedItemChange(draft: RestockDraftItem): void {
    const matched = this.getMatchedItem(draft);
    if (matched) {
      if (matched.location?.name) {
        draft.location = matched.location.name;
      }
      if (matched.unit?.shortName || matched.unit?.name) {
        draft.unit = matched.unit.shortName || matched.unit.name;
      }
      this.updateUnitLockForDraft(draft, matched);
    }
  }

  setActionMode(draft: RestockDraftItem, mode: 'update' | 'create'): void {
    draft.actionMode = mode;
    if (mode === 'create') {
      this.updateUnitLockForDraft(draft, null);
    } else if (mode === 'update' && draft.matchedItemId) {
      const matched = this.getMatchedItem(draft);
      this.updateUnitLockForDraft(draft, matched || null);
    }
  }

  getMatchedItem(draft: RestockDraftItem): IngredientItem | undefined {
    if (!draft.matchedItemId) return undefined;
    const candidate = draft.matchCandidates.find((c) => c.item.id === draft.matchedItemId);
    if (candidate) return candidate.item;
    return this.pantryItems().find((p) => p.id === draft.matchedItemId);
  }

  getCurrentCandidate(draft: RestockDraftItem): ItemSimilarityCandidate | undefined {
    if (!draft.matchedItemId) return draft.bestMatch || undefined;
    return (
      draft.matchCandidates.find((c) => c.item.id === draft.matchedItemId) ||
      draft.bestMatch ||
      undefined
    );
  }

  getMergedQuantity(draft: RestockDraftItem): number {
    if (draft.actionMode === 'update') {
      const matched = this.getMatchedItem(draft);
      return (matched ? matched.quantity : 0) + (draft.quantity || 0);
    }
    return draft.quantity || 0;
  }

  getDefaultLocationForCategory(category: string): string {
    const cat = (category || '').toLowerCase();
    if (
      cat.includes('dairy') ||
      cat.includes('produce') ||
      cat.includes('meat') ||
      cat.includes('seafood')
    ) {
      return 'Fridge';
    }
    if (cat.includes('frozen')) {
      return 'Freezer';
    }
    return 'Pantry Shelf';
  }

  setExpirationPreset(draft: RestockDraftItem, daysToAdd: number): void {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    draft.expirationDate = d;
  }

  toggleAll(checked: boolean): void {
    this.draftItems.update((items) => items.map((i) => ({ ...i, included: checked })));
  }

  get selectedCount(): number {
    return this.draftItems().filter((i) => i.included).length;
  }

  get updatingCount(): number {
    return this.draftItems().filter(
      (i) => i.included && i.actionMode === 'update' && i.matchedItemId,
    ).length;
  }

  get creatingCount(): number {
    return this.draftItems().filter(
      (i) => i.included && (i.actionMode === 'create' || !i.matchedItemId),
    ).length;
  }

  confirmRestock(): void {
    const itemsToRestock = this.draftItems().filter((i) => i.included);
    if (itemsToRestock.length === 0) {
      this.toastService.showWarning('Please select at least one item to restock');
      return;
    }

    this.isSubmitting.set(true);

    const unitsList = this.availableUnits();
    const locsList = this.availableLocations();
    let updatedCount = 0;
    let createdCount = 0;

    const restockRequests = itemsToRestock.map((draft) => {
      const matchedUnit: Unit = unitsList.find(
        (u) =>
          u.shortName.toLowerCase() === draft.unit.toLowerCase() ||
          u.name.toLowerCase() === draft.unit.toLowerCase(),
      ) || {
        id: 1,
        name: draft.unit,
        shortName: draft.unit,
        type: UnitType.Count,
        toBaseFactor: 1,
      };

      const matchedLoc: Location = locsList.find(
        (l) => l.name.toLowerCase() === draft.location.toLowerCase(),
      ) || {
        id: 1,
        name: draft.location,
      };

      if (draft.actionMode === 'update' && draft.matchedItemId) {
        const existingItem = this.getMatchedItem(draft);
        if (existingItem) {
          updatedCount++;
          const mergedQty = existingItem.quantity + (draft.quantity || 0);
          const updatedItem: Item = {
            id: existingItem.id,
            ingredientId: existingItem.ingredientId,
            name: draft.name,
            quantity: mergedQty,
            unit: matchedUnit,
            purchaseDate: existingItem.purchaseDate || new Date(),
            expirationDate:
              draft.expirationDate instanceof Date
                ? draft.expirationDate
                : new Date(draft.expirationDate),
            location: matchedLoc,
            notes:
              draft.notes ||
              existingItem.notes ||
              `Restocked from shopping list (${draft.category})`,
          };

          return (
            this.itemService.updateItem
              ? this.itemService.updateItem(updatedItem)
              : this.itemService.updateIngredientItem(updatedItem)
          ).pipe(catchError(() => of(null)));
        }
      }

      createdCount++;
      const newItem: Item = {
        id: '',
        name: draft.name,
        quantity: draft.quantity,
        unit: matchedUnit,
        purchaseDate: new Date(),
        expirationDate:
          draft.expirationDate instanceof Date
            ? draft.expirationDate
            : new Date(draft.expirationDate),
        location: matchedLoc,
        notes: draft.notes || `Restocked from shopping list (${draft.category})`,
      };

      return (
        this.itemService.addItem
          ? this.itemService.addItem(newItem)
          : this.itemService.addIngredientItem(newItem)
      ).pipe(catchError(() => of(null)));
    });

    forkJoin(restockRequests).subscribe({
      next: () => {
        itemsToRestock.forEach((item) => {
          this.shoppingListService.removeItem(item.shoppingId);
        });

        this.isSubmitting.set(false);
        this.toastService.showSuccess(
          `Successfully restocked items into inventory! (${updatedCount} updated, ${createdCount} created)`,
          'Restock Complete',
        );

        this.router.navigate(['/inventory']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.showError('Failed to restock items into inventory.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
