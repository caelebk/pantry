import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomeComponent } from '../home/home.component';

@Component({
  selector: 'pantry-dashboard',
  standalone: true,
  imports: [HomeComponent],
  template: `<pantry-home></pantry-home>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
