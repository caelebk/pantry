import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'item-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; }']
})
export class ItemCardComponent {
  @Input() item: any; // Using any for now, ideally an interface
}
