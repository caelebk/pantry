import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Item } from '@models/items.model';
import { Location } from '@models/location.model';
import { ShoppingItem } from '@models/shopping-list.model';
import { Unit, UnitType } from '@models/unit.model';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import { DatePickerModule } from 'primeng/datepicker';
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
}

@Component({
  selector: 'pantry-restock-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, DatePickerModule],
  templateUrl: './restock-review-page.component.html',
  styleUrl: './restock-review-page.component.scss',
})
export class RestockReviewPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly itemService = inject(ItemService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);

  readonly defaultLocations = ['Fridge', 'Freezer', 'Pantry Shelf', 'Spice Cabinet', 'Countertop'];
  readonly defaultUnits = ['pcs', 'kg', 'g', 'lbs', 'oz', 'bottle', 'can', 'pack', 'heads', 'bunch', 'ml', 'carton', 'wedge'];

  availableUnits = signal<Unit[]>([]);
  availableLocations = signal<Location[]>([]);

  locationsOptions = signal<string[]>(this.defaultLocations);
  unitsOptions = signal<string[]>(this.defaultUnits);

  draftItems = signal<RestockDraftItem[]>([]);
  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    // Fetch units and locations from backend
    this.unitService.getUnits().pipe(catchError(() => of([]))).subscribe((units) => {
      if (units && units.length > 0) {
        this.availableUnits.set(units);
        const names = Array.from(new Set([...units.map((u) => u.name), ...this.defaultUnits]));
        this.unitsOptions.set(names);
      }
    });

    this.locationService.getLocations().pipe(catchError(() => of([]))).subscribe((locs) => {
      if (locs && locs.length > 0) {
        this.availableLocations.set(locs);
        const names = Array.from(new Set([...locs.map((l) => l.name), ...this.defaultLocations]));
        this.locationsOptions.set(names);
      }
    });

    const boughtItems = this.shoppingListService.items().filter((i) => i.checked);
    
    // If no bought items, default draft with remaining items
    const sourceItems: ShoppingItem[] = boughtItems.length > 0
      ? boughtItems
      : this.shoppingListService.items();

    const defaultExp = new Date(Date.now() + 14 * 86400000);

    const drafts: RestockDraftItem[] = sourceItems.map((item) => ({
      shoppingId: item.id,
      name: item.name,
      category: item.category || 'General',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      location: this.getDefaultLocationForCategory(item.category),
      expirationDate: defaultExp,
      notes: item.recipeName ? `Restocked for recipe: ${item.recipeName}` : '',
      included: true,
    }));

    this.draftItems.set(drafts);
  }

  getDefaultLocationForCategory(category: string): string {
    const cat = (category || '').toLowerCase();
    if (cat.includes('dairy') || cat.includes('produce') || cat.includes('meat') || cat.includes('seafood')) {
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
    this.draftItems.update((items) =>
      items.map((i) => ({ ...i, included: checked }))
    );
  }

  get selectedCount(): number {
    return this.draftItems().filter((i) => i.included).length;
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

    const addRequests = itemsToRestock.map((draft) => {
      // Find matching Unit object or fallback
      const matchedUnit: Unit = unitsList.find(
        (u) => u.name.toLowerCase() === draft.unit.toLowerCase() || u.shortName.toLowerCase() === draft.unit.toLowerCase()
      ) || {
        id: 1,
        name: draft.unit,
        shortName: draft.unit,
        type: UnitType.Count,
        toBaseFactor: 1,
      };

      // Find matching Location object or fallback
      const matchedLoc: Location = locsList.find(
        (l) => l.name.toLowerCase() === draft.location.toLowerCase()
      ) || {
        id: 1,
        name: draft.location,
      };

      const newItem: Item = {
        id: '',
        name: draft.name,
        quantity: draft.quantity,
        unit: matchedUnit,
        purchaseDate: new Date(),
        expirationDate: draft.expirationDate instanceof Date ? draft.expirationDate : new Date(draft.expirationDate),
        location: matchedLoc,
        notes: draft.notes || `Restocked from shopping list (${draft.category})`,
      };

      return this.itemService.addItem(newItem).pipe(catchError((err) => of(null)));
    });

    forkJoin(addRequests).subscribe({
      next: () => {
        // Remove restocked items from shopping list
        itemsToRestock.forEach((item) => {
          this.shoppingListService.removeItem(item.shoppingId);
        });

        this.isSubmitting.set(false);
        this.toastService.showSuccess(
          `Successfully restocked ${itemsToRestock.length} item(s) into your Pantry inventory!`,
          'Restock Complete'
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
