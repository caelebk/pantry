import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { ToastService } from '@services/toast.service';

export interface BatchTask {
  id: string;
  category: 'Chopping & Veggies' | 'Protein Marinating' | 'Grain & Base Cooking' | 'Sauce & Dressing Prep';
  title: string;
  recipes: string[];
  estimatedMinutes: number;
  completed: boolean;
}

@Component({
  selector: 'pantry-batch-prep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batch-prep.component.html',
  styleUrl: './batch-prep.component.scss',
})
export class BatchPrepComponent {
  readonly mealPlannerService = inject(MealPlannerService);
  readonly toastService = inject(ToastService);

  @Input() meals: PlannedMeal[] = [];

  prepTasks = [
    {
      id: 'task-1',
      category: 'Chopping & Veggies' as const,
      title: 'Dice Onions, Tomatoes & Fresh Basil',
      recipes: ['Simple Tomato Basil Pasta', 'Classic Egg Omelette'],
      estimatedMinutes: 15,
      completed: false,
    },
    {
      id: 'task-2',
      category: 'Protein Marinating' as const,
      title: 'Marinate Chicken Breast & Salmon Fillets',
      recipes: ['Grilled Chicken Salad', 'Honey Garlic Salmon'],
      estimatedMinutes: 20,
      completed: false,
    },
    {
      id: 'task-3',
      category: 'Grain & Base Cooking' as const,
      title: 'Cook Big Batch of Quinoa & Brown Rice',
      recipes: ['Quinoa Veggie Power Bowl'],
      estimatedMinutes: 25,
      completed: false,
    },
    {
      id: 'task-4',
      category: 'Sauce & Dressing Prep' as const,
      title: 'Whisk Caesar & Honey Garlic Glaze',
      recipes: ['Grilled Chicken Salad', 'Honey Garlic Salmon'],
      estimatedMinutes: 10,
      completed: false,
    },
  ];

  readonly completedCount = computed(() => this.prepTasks.filter((t) => t.completed).length);
  readonly totalTasksCount = computed(() => this.prepTasks.length);
  readonly totalTimeSaved = computed(() => 45); // estimated time saved per week

  toggleTask(task: BatchTask): void {
    task.completed = !task.completed;
    if (task.completed) {
      this.toastService.showSuccess(`Completed prep: "${task.title}"`, 'Batch Prep Assistant');
    }
  }
}
