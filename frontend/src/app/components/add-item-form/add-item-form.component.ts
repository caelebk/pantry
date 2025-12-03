import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'add-item-form',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './add-item-form.component.html',
})
export class AddItemFormComponent {}
