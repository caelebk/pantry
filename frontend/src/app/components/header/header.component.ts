import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { TabsComponent } from '../tabs/tabs.component';
import { Tab } from '../tabs/tabs.model';

@Component({
  selector: 'pantry-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, TabsComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  authService = inject(AuthService);

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

  onLogout() {
    this.authService.logout().subscribe();
  }
}
