import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { TabsComponent } from '../tabs/tabs.component';
import { Tab } from '../tabs/tabs.model';

@Component({
  selector: 'pantry-header',
  standalone: true,
  imports: [CommonModule, TranslocoModule, TabsComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input() darkMode = false;
  @Input() activeTab: Tab = Tab.Dashboard;
  @Output() themeToggled = new EventEmitter<void>();
  @Output() tabSelected = new EventEmitter<Tab>();

  onTabSelected(tab: Tab) {
    this.tabSelected.emit(tab);
  }

  onToggle() {
    this.themeToggled.emit();
  }
}
