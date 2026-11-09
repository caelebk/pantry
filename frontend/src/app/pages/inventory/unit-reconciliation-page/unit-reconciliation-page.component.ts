import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItemDTO } from '@models/items.model';
import { Location } from '@models/location.model';
import { Unit } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { ingredientDetailReturnTo } from '@utility/ingredient-detail-return';
import { convertQuantity } from '@utility/itemUtility/UnitConversion';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { forkJoin } from 'rxjs';

interface ReconcileItemRow {
  id: string;
  label: string;
  locationName: string | null;
  oldQuantity: number;
  oldUnitName: string;
  newQuantity: number | null;
  needsManualInput: boolean;
}

import {
  AlertComponent,
  BadgeComponent,
  CardComponent,
  SkeletonComponent,
  SpinnerComponent,
} from '@ui';

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
    AlertComponent,
    BadgeComponent,
    CardComponent,
    SkeletonComponent,
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
  private readonly transloco = inject(TranslocoService);

  public ingredientId = signal<string | null>(null);
  public ingredient = signal<Ingredient | null>(null);
  public oldUnit = signal<Unit | null>(null);
  public targetUnit = signal<Unit | null>(null);
  public itemRows = signal<ReconcileItemRow[]>([]);
  public isLoading = signal<boolean>(true);
  public isSubmitting = signal<boolean>(false);
  public submitError = signal<string | null>(null);
  public submitAttempted = signal<boolean>(false);

  private get returnTo(): string | null {
    return ingredientDetailReturnTo(this.route.snapshot.queryParams?.['returnTo']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const targetUnitIdStr = this.route.snapshot.queryParamMap.get('targetUnitId');

    if (!id || !targetUnitIdStr) {
      this.toastService.showError(
        this.transloco.translate('inventory.unitReconciliation.invalidParams'),
      );
      this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
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
          const converted = convertQuantity(item.quantity, itemUnit, foundTarget);

          return {
            id: item.id,
            label: item.label,
            locationName: locMap.get(item.locationId) ?? null,
            oldQuantity: item.quantity,
            oldUnitName: itemUnit ? itemUnit.shortName : 'unit',
            newQuantity: converted === null ? null : Math.round(converted * 1000) / 1000,
            needsManualInput: converted === null,
          };
        });

        this.itemRows.set(rows);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reconciliation data:', err);
        this.toastService.showError(
          this.transloco.translate('inventory.unitReconciliation.loadFailed'),
        );
        this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
      },
    });
  }

  isRowInvalid(row: ReconcileItemRow): boolean {
    return row.newQuantity === null || row.newQuantity === undefined || row.newQuantity < 0;
  }

  onSubmit(): void {
    const id = this.ingredientId();
    const target = this.targetUnit();
    if (!id || !target) return;

    this.submitAttempted.set(true);
    if (this.itemRows().some((row) => this.isRowInvalid(row))) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const payloadItems = this.itemRows().map((row) => ({
      id: row.id,
      quantity: row.newQuantity as number,
    }));

    this.ingredientService.reconcileIngredientUnit(id, target.id, payloadItems).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.showSuccess(
          this.transloco.translate('inventory.unitReconciliation.reconciledMessage', {
            count: payloadItems.length,
            unit: target.name,
          }),
          this.transloco.translate('inventory.unitReconciliation.reconciledTitle'),
        );
        this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg =
          err?.message || this.transloco.translate('inventory.unitReconciliation.reconcileFailed');
        this.submitError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }

  onCancel(): void {
    this.router.navigate([this.returnTo ?? '/inventory/ingredients']);
  }
}
