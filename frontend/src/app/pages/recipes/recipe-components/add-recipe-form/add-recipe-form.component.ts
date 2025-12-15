import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'pantry-add-recipe-form',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './add-recipe-form.component.html',
})
export class AddRecipeFormComponent {}
