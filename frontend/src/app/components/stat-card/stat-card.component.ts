import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { NgxNumberTickerComponent } from '@omnedia/ngx-number-ticker';

@Component({
  selector: 'pantry-stat-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule, NgxNumberTickerComponent],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<number>();
  subtitle = input<string>();
  valueColor = input<string>('text-gray-900 dark:text-white');
}
