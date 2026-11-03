import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItem } from '@models/items.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { BadgeComponent, BadgeVariant, EmptyStateComponent, SkeletonComponent } from '@ui';
import { mapItemDTOToItem } from '@utility/itemUtility/ItemMapper';
import { isExpired, isExpiringSoon } from '@utility/itemUtility/ItemUtility';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'pantry-ingredient-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslocoModule,
    BadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './ingredient-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientDetailPageComponent {
  private deletion?: Subscription;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly itemService = inject(ItemService);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);
  private readonly ingredientService = inject(IngredientService);
  private readonly unitService = inject(UnitService);
  private readonly locationService = inject(LocationService);
  private readonly authService = inject(AuthService);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly reload = signal(0);

  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal(false);
  readonly ingredient = signal<Ingredient | null>(null);
  readonly items = signal<IngredientItem[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error' | 'not-found' | 'no-kitchen'>('loading');
  readonly ingredientId = computed(() => this.params().get('id') ?? '');
  readonly returnParams = computed(() => ({
    returnTo: `/inventory/ingredients/${this.ingredientId()}`,
  }));
  readonly addParams = computed(() => ({
    ...this.returnParams(),
    ingredientId: this.ingredientId(),
  }));
  readonly stock = computed(() => {
    const totals = new Map<number, { quantity: number; unit: string }>();
    for (const item of this.items()) {
      if (item.quantity <= 0 || isExpired(item)) continue;
      const total = totals.get(item.unit.id) ?? {
        quantity: 0,
        unit: item.unit.shortName || item.unit.name,
      };
      total.quantity += item.quantity;
      totals.set(item.unit.id, total);
    }
    return Array.from(totals.values());
  });

  constructor() {
    effect((onCleanup) => {
      this.ingredientId();
      const render = afterNextRender(
        {
          write: () => {
            const scrollContainer = this.element.nativeElement.closest('main')?.parentElement;
            if (scrollContainer) scrollContainer.scrollTop = 0;
          },
        },
        { injector: this.injector },
      );
      onCleanup(() => render.destroy());
    });
    effect((onCleanup) => {
      const id = this.ingredientId();
      this.deletion?.unsubscribe();
      this.deletingId.set(null);
      this.deleteError.set(false);
      const kitchen = this.authService.activeKitchen();
      this.reload();
      this.ingredient.set(null);
      this.items.set([]);
      if (!kitchen) {
        this.state.set('no-kitchen');
        return;
      }
      if (!id) {
        this.state.set('not-found');
        return;
      }
      this.state.set('loading');
      const request = forkJoin({
        ingredient: this.ingredientService.getIngredientById(id),
        items: this.ingredientService.getItemsByIngredientId(id),
        units: this.unitService.getUnits(),
        locations: this.locationService.getLocations(),
      }).subscribe({
        next: ({ ingredient, items, units, locations }) => {
          const unitMap = new Map(units.map((unit) => [unit.id, unit]));
          const locationMap = new Map(locations.map((location) => [location.id, location]));
          try {
            const mapped = items.map((item) => mapItemDTOToItem(item, unitMap, locationMap));
            mapped.sort(
              (a, b) =>
                (a.expirationDate?.getTime() ?? Infinity) -
                  (b.expirationDate?.getTime() ?? Infinity) || a.name.localeCompare(b.name),
            );
            this.items.set(mapped);
            this.ingredient.set(ingredient);
            this.state.set('ready');
          } catch {
            this.state.set('error');
          }
        },
        error: (error: unknown) => {
          this.state.set(
            error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400)
              ? 'not-found'
              : 'error',
          );
        },
      });
      onCleanup(() => {
        request.unsubscribe();
        this.deletion?.unsubscribe();
      });
    });
  }

  retry(): void {
    this.reload.update((value) => value + 1);
  }

  deleteItem(item: IngredientItem): void {
    if (
      this.deletingId() ||
      !confirm(this.transloco.translate('ingredientDetail.deleteConfirm', { name: item.name }))
    )
      return;
    this.deletingId.set(item.id);
    this.deleteError.set(false);
    this.deletion = this.itemService.removeIngredientItem(item).subscribe({
      next: () => {
        this.items.update((items) => items.filter((candidate) => candidate.id !== item.id));
        this.deletingId.set(null);
        this.toastService.showSuccess(this.transloco.translate('ingredientDetail.deleteSuccess'));
      },
      error: () => {
        this.deletingId.set(null);
        this.deleteError.set(true);
      },
    });
  }

  itemStatus(item: IngredientItem): { variant: BadgeVariant; key: string } {
    if (item.quantity <= 0) return { variant: 'neutral', key: 'ingredientDetail.outOfStock' };
    if (isExpired(item)) return { variant: 'expired', key: 'ingredientDetail.expired' };
    if (isExpiringSoon(item)) return { variant: 'expiring', key: 'ingredientDetail.expiring' };
    return { variant: 'fresh', key: 'ingredientDetail.fresh' };
  }
}
