import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
})
export class TabsComponent {
  @Input() activeTab: string = 'inventory';
  @Output() tabSelected = new EventEmitter<string>();

  selectTab(tab: string) {
    this.tabSelected.emit(tab);
  }
}
