import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'stat-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<number | string>();
  subtitle = input<string>();
  valueColor = input<string>('text-gray-900 dark:text-white');
}
