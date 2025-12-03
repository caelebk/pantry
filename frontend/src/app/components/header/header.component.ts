import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input() darkMode = false;
  @Output() themeToggled = new EventEmitter<void>();

  onToggle() {
    this.themeToggled.emit();
  }
}
