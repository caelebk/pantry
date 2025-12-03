import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-card.component.html',
  styles: [':host { display: block; }']
})
export class ItemCardComponent {
  @Input() item: any; // Using any for now, ideally an interface
}
