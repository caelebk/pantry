import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'pantry-stat-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './stat-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<number>();
  subtitle = input<string>();
  valueColor = input<string>('text-gray-900 dark:text-white');
  trend = input<string>();
  trendClass = input<string>('badge-primary');

}
