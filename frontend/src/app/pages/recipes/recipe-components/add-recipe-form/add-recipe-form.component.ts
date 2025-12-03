import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'add-recipe-form',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './add-recipe-form.component.html',
})
export class AddRecipeFormComponent {}
