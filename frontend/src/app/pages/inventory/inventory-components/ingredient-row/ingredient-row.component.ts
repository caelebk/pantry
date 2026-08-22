import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { EnrichedIngredient } from '@models/inventory.models';
import { BadgeComponent } from '@ui';

@Component({
  selector: 'pantry-ingredient-row',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './ingredient-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientRowComponent {
  @Input({ required: true })
  ingredient!: EnrichedIngredient;
  @Input({ required: true })
  categoryName!: string;
  @Input()
  isExpanded = false;

  @Output()
  toggleExpand = new EventEmitter<string>();
}
