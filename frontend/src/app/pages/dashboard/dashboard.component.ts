import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslocoModule, StatCardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  totalItems: number = 5;
  expiringSoonItems: number = 0;
  expiredItems: number = 5;
  canMakeRecipes: number = 0;
}
