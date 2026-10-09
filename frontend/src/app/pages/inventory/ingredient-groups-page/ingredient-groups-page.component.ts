import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IngredientCategory } from '@models/ingredient-category.model';
import { IngredientGroup } from '@models/ingredient-group.model';
import { Ingredient } from '@models/ingredient.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { EmptyStateComponent, SearchInputComponent, SpinnerComponent } from '@ui';
import { PrimeIcons } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'pantry-ingredient-groups-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    EmptyStateComponent,
    SearchInputComponent,
    SpinnerComponent,
  ],
  templateUrl: './ingredient-groups-page.component.html',
  styleUrl: './ingredient-groups-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientGroupsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly ingredientService = inject(IngredientService);
  private readonly groupService = inject(IngredientGroupService);
  private readonly categoryService = inject(IngredientCategoryService);
  private readonly reload = signal(0);
  private readonly knownIcons = new Set<string>(Object.values(PrimeIcons));
  readonly state = signal<'loading' | 'ready' | 'error' | 'no-kitchen'>('loading');
  readonly ingredients = signal<Ingredient[]>([]);
  readonly groups = signal<IngredientGroup[]>([]);
  readonly categories = signal<IngredientCategory[]>([]);
  readonly searchQuery = signal('');
  private readonly expandedCategories = signal(new Set<number>());
  private readonly searchCollapsedCategories = signal(new Set<number>());
  readonly ingredientCounts = computed(() => {
    const counts = new Map<number, number>();
    for (const ingredient of this.ingredients()) {
      const id = (ingredient.ingredientGroup ?? ingredient.category)?.id;
      if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  });
  readonly sections = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const categories = [...this.categories()].sort((a, b) => a.name.localeCompare(b.name));
    const knownIds = new Set(categories.map((category) => category.id));
    const sections = categories.map((category) => ({
      category,
      groups: this.groups().filter((group) => group.ingredientCategoryId === category.id),
      unclassified: false,
    }));
    const unclassified = this.groups().filter(
      (group) => !knownIds.has(group.ingredientCategoryId ?? -1),
    );
    if (unclassified.length)
      sections.push({
        category: { id: -1, name: 'Unclassified', icon: 'pi pi-folder' },
        groups: unclassified,
        unclassified: true,
      });
    return sections
      .map((section) => ({
        ...section,
        totalGroups: section.groups.length,
        groups: section.groups
          .filter(
            (group) =>
              !query ||
              section.category.name.toLocaleLowerCase().includes(query) ||
              group.name.toLocaleLowerCase().includes(query),
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter(
        (section) =>
          !query ||
          section.groups.length ||
          section.category.name.toLocaleLowerCase().includes(query),
      );
  });

  constructor() {
    effect(() => {
      this.searchQuery();
      this.searchCollapsedCategories.set(new Set());
    });
    effect(() => {
      this.authService.activeKitchen();
      this.expandedCategories.set(new Set());
      this.searchCollapsedCategories.set(new Set());
    });
    effect((onCleanup) => {
      const kitchenId = this.authService.activeKitchen()?.id;
      this.reload();
      this.ingredients.set([]);
      this.groups.set([]);
      this.categories.set([]);
      if (!kitchenId) {
        this.state.set('no-kitchen');
        return;
      }
      this.state.set('loading');
      const request = forkJoin({
        ingredients: this.ingredientService.getIngredients(),
        groups: this.groupService.getIngredientGroups(),
        categories: this.categoryService.getIngredientCategories(),
      }).subscribe({
        next: ({ ingredients, groups, categories }) => {
          this.ingredients.set(ingredients);
          this.groups.set(groups);
          this.categories.set(categories);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  isExpanded(id: number): boolean {
    return this.searchQuery().trim()
      ? !this.searchCollapsedCategories().has(id)
      : this.expandedCategories().has(id);
  }

  toggleCategory(id: number): void {
    const state = this.searchQuery().trim()
      ? this.searchCollapsedCategories
      : this.expandedCategories;
    state.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  retry(): void {
    this.reload.update((value) => value + 1);
  }

  iconClass(icon?: string): string | null {
    return icon && this.knownIcons.has(icon) ? icon : null;
  }

  emojiIcon(icon?: string): string | null {
    return icon && /\p{Extended_Pictographic}/u.test(icon) && icon.length <= 16 ? icon : null;
  }
}
