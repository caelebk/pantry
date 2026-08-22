import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItemDTO } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { forkJoin } from 'rxjs';

interface ReconcileItemRow {
  id: string;
  label: string;
  locationName: string;
  oldQuantity: number;
  oldUnitName: string;
  newQuantity: number;
}

import { SpinnerComponent } from '@ui';

@Component({
  selector: 'pantry-unit-reconciliation-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputNumberModule,
    TableModule,
    ButtonModule,
    TranslocoModule,
    SpinnerComponent,
  ],
  templateUrl: './unit-reconciliation-page.component.html',
})
export class UnitReconciliationPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly toastService = inject(ToastService);

  public ingredientId = signal<string | null>(null);
  public ingredient = signal<Ingredient | null>(null);
  public oldUnit = signal<Unit | null>(null);
  public targetUnit = signal<Unit | null>(null);
  public itemRows = signal<ReconcileItemRow[]>([]);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const targetUnitIdStr = this.route.snapshot.queryParamMap.get('targetUnitId');

    if (!id || !targetUnitIdStr) {
      this.toastService.showError('Invalid reconciliation parameters.');
      this.router.navigate(['/inventory/ingredients']);
      return;
    }

    const targetUnitId = parseInt(targetUnitIdStr, 10);
    this.ingredientId.set(id);

    forkJoin({
      units: this.unitService.getUnits(),
      ingredient: this.ingredientService.getIngredientById(id),
      locations: this.locationService.getLocations(),
      items: this.ingredientService.getItemsByIngredientId(id),
    }).subscribe({
      next: ({ units, ingredient, locations, items }) => {
        const foundTarget = units.find((u) => u.id === targetUnitId) || null;
        this.targetUnit.set(foundTarget);
        this.ingredient.set(ingredient);
        this.oldUnit.set(ingredient.defaultUnit || null);

        const locMap = new Map<number, string>(locations.map((l: Location) => [l.id, l.name]));

        const rows: ReconcileItemRow[] = items.map((item: IngredientItemDTO) => {
          const itemUnit = units.find((u) => u.id === item.unitId);
          let suggestedQty = item.quantity;

          if (
            itemUnit &&
            foundTarget &&
            itemUnit.toBaseFactor &&
            foundTarget.toBaseFactor &&
            itemUnit.type === foundTarget.type
          ) {
            suggestedQty = (item.quantity * itemUnit.toBaseFactor) / foundTarget.toBaseFactor;
          }

          return {
            id: item.id,
            label: item.label,
            locationName: locMap.get(item.locationId) || 'Pantry',
            oldQuantity: item.quantity,
            oldUnitName: itemUnit ? itemUnit.shortName : 'unit',
            newQuantity: Math.round(suggestedQty * 1000) / 1000,
          };
        });

        this.itemRows.set(rows);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reconciliation data:', err);
        this.toastService.showError('Failed to load details for reconciliation.');
        this.router.navigate(['/inventory/ingredients']);
      },
    });
  }

  onSubmit(): void {
    const id = this.ingredientId();
    const target = this.targetUnit();
    if (!id || !target) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const payloadItems = this.itemRows().map((row) => ({
      id: row.id,
      quantity: row.newQuantity,
    }));

    this.ingredientService.reconcileIngredientUnit(id, target.id, payloadItems).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.showSuccess(
          `Reconciled ${payloadItems.length} item(s) to unit "${target.name}".`,
          'Measures Reconciled',
        );
        this.router.navigate(['/inventory/ingredients']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.message || 'Failed to reconcile item measures.';
        this.submitError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/inventory/ingredients']);
  }
}
