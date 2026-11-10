import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItem, Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { ShoppingItem } from '@models/shopping-list.model';
import { Unit } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService, ItemSimilarityCandidate } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import {
  BadgeComponent,
  CardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  SegmentedControlComponent,
  SpinnerComponent,
} from '@ui';
import { convertQuantity } from '@utility/itemUtility/UnitConversion';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MatchCandidateOption {
  label: string;
  value: string;
}

export interface RestockDraftItem {
  shoppingId: string;
  ingredientId?: string;
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
  sourceQuantity: number;
  sourceUnit: string;
}

@Component({
  selector: 'pantry-restock-review-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    CheckboxModule,
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
    FormFieldComponent,
    SegmentedControlComponent,
    SpinnerComponent,
    TranslocoPipe,
  ],
  templateUrl: './restock-review-page.component.html',
})
export class RestockReviewPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly itemService = inject(ItemService);
  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly Math = Math;

  readonly draftItems = signal<RestockDraftItem[]>([]);
  readonly isSubmitting = signal<boolean>(false);

  readonly pantryItems = signal<IngredientItem[]>([]);
  readonly availableIngredients = signal<Ingredient[]>([]);
  readonly availableUnits = signal<Unit[]>([]);
  readonly availableLocations = signal<Location[]>([]);

  readonly unitsOptions = signal<string[]>([]);
  readonly locationsOptions = signal<string[]>([]);
  private readonly selectedRestockIds = signal<Set<string> | null>(null);
  private draftsInitialised = false;

  constructor() {
    const ids = this.route?.snapshot.queryParamMap.get('ids');
    if (ids) this.selectedRestockIds.set(new Set(ids.split(',').filter(Boolean)));

    effect(() => {
      const hasLoaded = this.shoppingListService.hasLoaded();
      const shoppingItems = this.shoppingListService.items();
      if (hasLoaded && !this.draftsInitialised) {
        untracked(() => this.initDrafts(shoppingItems));
      }
    });
  }

  ngOnInit(): void {
    if (!this.shoppingListService.hasLoaded() && !this.shoppingListService.isLoading()) {
      this.shoppingListService.loadItemsFromBackend();
    }

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
          this.unitsOptions.set(Array.from(new Set(units.map((u) => u.shortName))));
          this.reevaluateSimilarityForDrafts();
        }
      });

    this.locationService
      .getLocations()
      .pipe(catchError(() => of([])))
      .subscribe((locs) => {
        if (locs && locs.length > 0) {
          this.availableLocations.set(locs);
          this.locationsOptions.set(Array.from(new Set(locs.map((l) => l.name))));
          this.draftItems().forEach((draft) => {
            if (!draft.location)
              draft.location = this.getDefaultLocationForCategory(draft.category);
          });
          this.refreshDrafts();
        }
      });
  }

  private initDrafts(sourceList: ShoppingItem[]): void {
    this.draftsInitialised = true;
    const scoped = this.selectedRestockIds();
    // Explicit ids are the checked items of one store, so unbought items count too.
    const sourceItems: ShoppingItem[] = scoped
      ? sourceList.filter((item) => scoped.has(item.id))
      : sourceList.filter((i) => i.checked);

    const defaultExp = new Date(Date.now() + 14 * 86400000);

    const drafts: RestockDraftItem[] = sourceItems.map((item) => {
      const draft: RestockDraftItem = {
        shoppingId: item.id,
        ingredientId: item.ingredientId,
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
        sourceQuantity: item.quantity || 1,
        sourceUnit: item.unit || 'pcs',
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
        this.refreshDrafts();
      });
  }

  /** Drafts are mutated in place by async callbacks; publish a new array so OnPush views re-render. */
  private refreshDrafts(): void {
    this.draftItems.update((items) => [...items]);
  }

  private updateUnitLockForDraft(draft: RestockDraftItem, item: IngredientItem | null): void {
    const ingredients = this.availableIngredients();
    let linkedIng: Ingredient | undefined;

    if (item?.ingredientId) {
      linkedIng = ingredients.find((i) => i.id === item.ingredientId);
    } else if (draft.name) {
      linkedIng = ingredients.find((i) => i.name.toLowerCase() === draft.name.trim().toLowerCase());
    }

    const sourceUnit = this.findUnit(draft.sourceUnit);
    const currentUnit = this.findUnit(draft.unit);
    const targetUnit = linkedIng?.defaultUnit ?? item?.unit;
    // Convert from what the draft holds now, so a quantity the user typed survives a mode toggle.
    const converted = targetUnit ? convertQuantity(draft.quantity, currentUnit, targetUnit) : null;

    if (targetUnit && converted !== null) {
      draft.quantity = Math.round(converted * 1000) / 1000;
      draft.unit = targetUnit.shortName || targetUnit.name;
      draft.isUnitLocked = !!linkedIng?.defaultUnit;
    } else {
      // No usable target unit: fall back to the shopping list unit, converting only if it differs.
      const sameAsSource =
        currentUnit && sourceUnit
          ? currentUnit.id === sourceUnit.id
          : draft.unit === draft.sourceUnit;
      if (!sameAsSource) {
        const back = convertQuantity(draft.quantity, currentUnit, sourceUnit);
        draft.quantity = back !== null ? Math.round(back * 1000) / 1000 : draft.sourceQuantity;
      }
      draft.unit = sourceUnit ? sourceUnit.shortName || sourceUnit.name : draft.sourceUnit;
      draft.isUnitLocked = false;
    }

    if (item && draft.actionMode === 'update' && this.getMergeableQuantity(draft, item) === null) {
      draft.actionMode = 'create';
    }
  }

  private findUnit(name: string): Unit | undefined {
    const lower = (name || '').trim().toLowerCase();
    return this.availableUnits().find(
      (u) => u.shortName.toLowerCase() === lower || u.name.toLowerCase() === lower,
    );
  }

  private getMergeableQuantity(draft: RestockDraftItem, matched: IngredientItem): number | null {
    const converted = convertQuantity(draft.quantity || 0, this.findUnit(draft.unit), matched.unit);
    return converted === null ? null : matched.quantity + converted;
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
      this.updateUnitLockForDraft(draft, matched);
    }
  }

  onActionModeChange(draft: RestockDraftItem, mode: string | undefined): void {
    if (mode === 'update' || mode === 'create') this.setActionMode(draft, mode);
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

  matchOptions(draft: RestockDraftItem): MatchCandidateOption[] {
    return draft.matchCandidates.map((c) => ({
      value: c.item.id,
      label: this.transloco.translate('restockReview.matchOption', {
        name: c.item.name,
        quantity: c.item.quantity,
        unit: c.item.unit.name,
        location: c.item.location.name,
        percent: Math.round(c.score * 100),
      }),
    }));
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
      const merged = matched ? this.getMergeableQuantity(draft, matched) : null;
      return merged ?? (draft.quantity || 0);
    }
    return draft.quantity || 0;
  }

  getMergedUnitLabel(draft: RestockDraftItem): string {
    const matched = this.getMatchedItem(draft);
    if (matched && this.getMergeableQuantity(draft, matched) !== null) {
      return matched.unit.shortName || matched.unit.name;
    }
    return draft.unit;
  }

  getDefaultLocationForCategory(category: string): string {
    const names = this.availableLocations().map((l) => l.name);
    const find = (wanted: string) => names.find((n) => n.toLowerCase() === wanted);
    const cat = (category || '').toLowerCase();
    if (
      cat.includes('dairy') ||
      cat.includes('produce') ||
      cat.includes('meat') ||
      cat.includes('seafood')
    ) {
      return find('fridge') ?? find('pantry') ?? names[0] ?? '';
    }
    if (cat.includes('frozen')) {
      return find('freezer') ?? find('pantry') ?? names[0] ?? '';
    }
    return find('pantry') ?? names[0] ?? '';
  }

  setExpirationPreset(draft: RestockDraftItem, daysToAdd: number): void {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    draft.expirationDate = d;
  }

  toggleAll(checked: boolean): void {
    // Mutate in place: pending similarity callbacks hold references to these draft objects.
    this.draftItems().forEach((draft) => (draft.included = checked));
    this.refreshDrafts();
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
      this.toastService.showWarning(this.transloco.translate('restockReview.toasts.selectOne'));
      return;
    }

    const locsList = this.availableLocations();
    const resolved = itemsToRestock.map((draft) => ({
      draft,
      unit: this.findUnit(draft.unit),
      location: locsList.find((l) => l.name.toLowerCase() === (draft.location || '').toLowerCase()),
    }));
    if (resolved.some((r) => !r.unit || !r.location)) {
      this.toastService.showWarning(
        this.transloco.translate('restockReview.toasts.chooseUnitLocation'),
      );
      return;
    }

    this.isSubmitting.set(true);

    let updatedCount = 0;
    let createdCount = 0;

    const restockRequests = resolved.map(({ draft, unit, location }) => {
      const matchedUnit = unit as Unit;
      const matchedLoc = location as Location;

      if (draft.actionMode === 'update' && draft.matchedItemId) {
        const existingItem = this.getMatchedItem(draft);
        const mergedQty = existingItem ? this.getMergeableQuantity(draft, existingItem) : null;
        if (existingItem && mergedQty !== null) {
          updatedCount++;
          const updatedItem: Item = {
            id: existingItem.id,
            ingredientId: existingItem.ingredientId,
            name: draft.name,
            quantity: mergedQty,
            unit: existingItem.unit,
            purchaseDate: new Date(),
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
        ingredientId: draft.ingredientId,
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
      next: (results) => {
        results.forEach((result, index) => {
          if (result) this.shoppingListService.removeItem(itemsToRestock[index].shoppingId);
        });

        this.isSubmitting.set(false);
        this.toastService.showSuccess(
          this.transloco.translate('restockReview.toasts.success', {
            updated: updatedCount,
            created: createdCount,
          }),
          this.transloco.translate('restockReview.toasts.successTitle'),
        );

        this.router.navigate(['/inventory']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.showError(this.transloco.translate('restockReview.toasts.failure'));
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
