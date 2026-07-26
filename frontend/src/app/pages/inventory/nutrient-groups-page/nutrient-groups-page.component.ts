import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NutrientGroup } from '@models/nutrient-type.model';
import { NutrientTypeService } from '@services/inventory/nutrient-type.service';
import { ToastService } from '@services/toast.service';

@Component({
  selector: 'pantry-nutrient-groups-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nutrient-groups-page.component.html',
})
export class NutrientGroupsPageComponent implements OnInit {
  private readonly nutrientTypeService = inject(NutrientTypeService);
  private readonly toastService = inject(ToastService);

  public nutrientGroups = signal<NutrientGroup[]>([]);
  public isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.nutrientTypeService.getNutrientGroups().subscribe({
      next: (groups) => {
        this.nutrientGroups.set(groups);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching nutrient groups:', err);
        this.toastService.showError('Failed to load nutrient groups.');
        this.isLoading.set(false);
      },
    });
  }
}
