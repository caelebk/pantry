import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddRecipeFormComponent } from '../../components/add-recipe-form/add-recipe-form.component';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, AddRecipeFormComponent, RecipeCardComponent],
  templateUrl: './recipes.component.html',
})
export class RecipesComponent {
  recipes = [
    {
      name: 'Simple Pasta',
      description: 'Classic pasta dish with olive oil and garlic',
      servings: 2,
      prepTime: '10 min',
      cookTime: '20 min',
      totalTime: '30 min',
      tags: ['Easy', 'Italian', 'Quick', 'Vegetarian'],
      ingredients: [
        '400 g Pasta',
        '3 tbsp Olive Oil',
        '4 cloves Garlic'
      ],
      instructions: [
        'Boil water in a large pot',
        'Add pasta and cook until al dente',
        'Drain and set aside',
        'Heat olive oil and sauté garlic',
        'Toss pasta with garlic oil',
        'Serve immediately'
      ]
    }
  ];
}
