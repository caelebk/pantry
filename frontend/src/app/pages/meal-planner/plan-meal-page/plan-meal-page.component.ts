import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DayOfWeek, MealType } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import {
  AlertComponent,
  CardComponent,
  EmptyStateComponent,
  SearchInputComponent,
  SegmentedControlComponent,
  SegmentedOption,
  SkeletonComponent,
} from '@ui';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { switchMap } from 'rxjs';

@Component({
  selector: 'pantry-plan-meal-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    InputNumberModule,
    SelectModule,
    AlertComponent,
    CardComponent,
    EmptyStateComponent,
    SearchInputComponent,
    SegmentedControlComponent,
    SkeletonComponent,
  ],
  templateUrl: './plan-meal-page.component.html',
  styleUrl: './plan-meal-page.component.scss',
})
export class PlanMealPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mealPlannerService = inject(MealPlannerService);
  private readonly recipeService = inject(RecipeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly days: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  private readonly transloco = inject(TranslocoService);
  // Re-emits once the active language's translations are loaded, so computed labels refresh.
  private readonly translationsReady = toSignal(
    this.transloco.langChanges$.pipe(switchMap((lang) => this.transloco.load(lang))),
  );

  readonly dayOptions = computed(() => {
    this.translationsReady();
    return this.days.map((day) => ({
      value: day,
      label: this.transloco.translate(`mealPlanner.days.${day.toLowerCase()}`),
    }));
  });

  readonly mealTypeOptions = computed<SegmentedOption<MealType>[]>(() => {
    this.translationsReady();
    return this.mealTypes.map((t) => ({
      value: t,
      label: this.transloco.translate(`mealPlanner.mealTypes.${t.toLowerCase()}`),
    }));
  });

  selectedDay = signal<DayOfWeek>('Monday');
  selectedMealType = signal<MealType>('Dinner');
  selectedRecipe = signal<Recipe | null>(null);
  searchQuery = signal<string>('');
  servings = signal<number | null>(2);

  availableRecipes = signal<Recipe[]>([]);
  isLoading = signal<boolean>(false);
  loadFailed = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  saveFailed = signal<boolean>(false);

  ngOnInit(): void {
    // Read query params if provided (e.g. ?day=Tuesday&type=Lunch)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['day'] && this.days.includes(params['day'])) {
        this.selectedDay.set(params['day']);
      }
      if (params['type'] && this.mealTypes.includes(params['type'])) {
        this.selectedMealType.set(params['type']);
      }
    });

    this.loadRecipes();
  }

  loadRecipes(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.availableRecipes.set(recipes);
        this.isLoading.set(false);
      },
      error: () => {
        this.availableRecipes.set([]);
        this.selectedRecipe.set(null);
        this.loadFailed.set(true);
        this.isLoading.set(false);
      },
    });
  }

  filteredRecipes(): Recipe[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.availableRecipes();
    return this.availableRecipes().filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }

  selectDay(day: DayOfWeek): void {
    this.selectedDay.set(day);
  }

  selectMealType(type: MealType | undefined): void {
    if (type) this.selectedMealType.set(type);
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
    this.servings.set(recipe.servings && recipe.servings > 0 ? recipe.servings : 2);
  }

  saveMealPlan(): void {
    const recipe = this.selectedRecipe();
    if (!recipe || this.loadFailed() || this.isSaving()) return;

    // Create recipe copy with updated servings if modified
    const recipeToSave: Recipe = {
      ...recipe,
      servings: Math.max(1, this.servings() ?? 1),
    };

    this.isSaving.set(true);
    this.saveFailed.set(false);
    this.mealPlannerService.addMealPlan(this.selectedDay(), this.selectedMealType(), recipeToSave, {
      onSuccess: () => {
        this.isSaving.set(false);
        this.goBack();
      },
      onError: () => {
        this.isSaving.set(false);
        this.saveFailed.set(true);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/meal-planner']);
  }
}
