export const seedData = {
  locations: [
    { name: 'Pantry' },
    { name: 'Fridge' },
    { name: 'Freezer' },
    { name: 'Shelf' },
  ],
  categories: [
    { name: 'Produce' },
    { name: 'Meat & Seafood' },
    { name: 'Dairy & Eggs' },
    { name: 'Bakery & Grains' },
    { name: 'Pantry Staples' },
    { name: 'Canned Goods' },
    { name: 'Oils & Condiments' },
    { name: 'Spices & Seasonings' },
    { name: 'Snacks' },
    { name: 'Frozen Foods' },
    { name: 'Beverages' },
    { name: 'Breakfast' },
    { name: 'Ready-to-Eat' },
    { name: 'Baking' },
  ],
  units: [
    { name: 'piece', short_name: 'pc', type: 'count', to_base_factor: 1 },
    { name: 'gram', short_name: 'g', type: 'weight', to_base_factor: 1 },
    { name: 'kilogram', short_name: 'kg', type: 'weight', to_base_factor: 1000 },
    { name: 'ounce', short_name: 'oz', type: 'weight', to_base_factor: 28.3495 },
    { name: 'pound', short_name: 'lb', type: 'weight', to_base_factor: 453.592 },
    { name: 'milliliter', short_name: 'ml', type: 'volume', to_base_factor: 1 },
    { name: 'liter', short_name: 'l', type: 'volume', to_base_factor: 1000 },
    { name: 'cup', short_name: 'cup', type: 'volume', to_base_factor: 236.588 },
    { name: 'tablespoon', short_name: 'tbsp', type: 'volume', to_base_factor: 14.7868 },
    { name: 'teaspoon', short_name: 'tsp', type: 'volume', to_base_factor: 4.92892 },
    { name: 'clove', short_name: 'clv', type: 'count', to_base_factor: 1 },
    { name: 'pinch', short_name: 'pin', type: 'count', to_base_factor: 1 },
    { name: 'can', short_name: 'can', type: 'count', to_base_factor: 1 },
  ],
  difficulties: [
    { name: 'Easy' },
    { name: 'Medium' },
    { name: 'Hard' },
  ],
  ingredients: [
    // Produce
    { name: 'Apples', category: 'Produce', default_unit: 'piece' },
    { name: 'Bananas', category: 'Produce', default_unit: 'piece' },
    { name: 'Spinach', category: 'Produce', default_unit: 'gram' },
    { name: 'Onions', category: 'Produce', default_unit: 'piece' },
    { name: 'Garlic', category: 'Produce', default_unit: 'clove' },
    { name: 'Carrots', category: 'Produce', default_unit: 'piece' },
    { name: 'Potatoes', category: 'Produce', default_unit: 'kilogram' },
    { name: 'Tomatoes', category: 'Produce', default_unit: 'piece' },
    { name: 'Avocados', category: 'Produce', default_unit: 'piece' },
    { name: 'Lemons', category: 'Produce', default_unit: 'piece' },
    { name: 'Fresh Basil', category: 'Produce', default_unit: 'gram' },

    // Meat & Seafood
    { name: 'Chicken Breast', category: 'Meat & Seafood', default_unit: 'kilogram' },
    { name: 'Ground Beef', category: 'Meat & Seafood', default_unit: 'kilogram' },
    { name: 'Salmon Fillet', category: 'Meat & Seafood', default_unit: 'kilogram' },
    { name: 'Bacon', category: 'Meat & Seafood', default_unit: 'gram' },
    { name: 'Pork Chops', category: 'Meat & Seafood', default_unit: 'piece' },

    // Dairy & Eggs
    { name: 'Milk', category: 'Dairy & Eggs', default_unit: 'liter' },
    { name: 'Large Eggs', category: 'Dairy & Eggs', default_unit: 'piece' },
    { name: 'Cheddar Cheese', category: 'Dairy & Eggs', default_unit: 'gram' },
    { name: 'Greek Yogurt', category: 'Dairy & Eggs', default_unit: 'gram' },
    { name: 'Unsalted Butter', category: 'Dairy & Eggs', default_unit: 'gram' },
    { name: 'Heavy Cream', category: 'Dairy & Eggs', default_unit: 'milliliter' },
    { name: 'Parmesan Cheese', category: 'Dairy & Eggs', default_unit: 'gram' },
    { name: 'Feta Cheese', category: 'Dairy & Eggs', default_unit: 'gram' },

    // Bakery & Grains
    { name: 'Sourdough Bread', category: 'Bakery & Grains', default_unit: 'piece' },
    { name: 'Basmati Rice', category: 'Bakery & Grains', default_unit: 'kilogram' },
    { name: 'Spaghetti', category: 'Bakery & Grains', default_unit: 'gram' },
    { name: 'Penne Pasta', category: 'Bakery & Grains', default_unit: 'gram' },
    { name: 'Quinoa', category: 'Bakery & Grains', default_unit: 'gram' },
    { name: 'Rolled Oats', category: 'Bakery & Grains', default_unit: 'gram' },

    // Pantry Staples
    { name: 'All-Purpose Flour', category: 'Pantry Staples', default_unit: 'kilogram' },
    { name: 'Granulated Sugar', category: 'Pantry Staples', default_unit: 'kilogram' },
    { name: 'Brown Sugar', category: 'Pantry Staples', default_unit: 'kilogram' },
    { name: 'Baking Powder', category: 'Pantry Staples', default_unit: 'teaspoon' },
    { name: 'Honey', category: 'Pantry Staples', default_unit: 'milliliter' },
    { name: 'Peanut Butter', category: 'Pantry Staples', default_unit: 'gram' },
    { name: 'Vanilla Extract', category: 'Pantry Staples', default_unit: 'teaspoon' },

    // Canned Goods
    { name: 'Chickpeas', category: 'Canned Goods', default_unit: 'can' },
    { name: 'Black Beans', category: 'Canned Goods', default_unit: 'can' },
    { name: 'Diced Tomatoes', category: 'Canned Goods', default_unit: 'can' },
    { name: 'Coconut Milk', category: 'Canned Goods', default_unit: 'milliliter' },
    { name: 'Canned Tuna', category: 'Canned Goods', default_unit: 'can' },
    { name: 'Marinara Sauce', category: 'Canned Goods', default_unit: 'milliliter' },

    // Oils & Condiments
    { name: 'Olive Oil', category: 'Oils & Condiments', default_unit: 'milliliter' },
    { name: 'Vegetable Oil', category: 'Oils & Condiments', default_unit: 'milliliter' },
    { name: 'Soy Sauce', category: 'Oils & Condiments', default_unit: 'milliliter' },
    { name: 'Balsamic Vinegar', category: 'Oils & Condiments', default_unit: 'milliliter' },
    { name: 'Ketchup', category: 'Oils & Condiments', default_unit: 'milliliter' },
    { name: 'Mayonnaise', category: 'Oils & Condiments', default_unit: 'milliliter' },
    { name: 'Dijon Mustard', category: 'Oils & Condiments', default_unit: 'teaspoon' },

    // Spices & Seasonings
    { name: 'Salt', category: 'Spices & Seasonings', default_unit: 'gram' },
    { name: 'Black Pepper', category: 'Spices & Seasonings', default_unit: 'gram' },
    { name: 'Cumin', category: 'Spices & Seasonings', default_unit: 'teaspoon' },
    { name: 'Paprika', category: 'Spices & Seasonings', default_unit: 'teaspoon' },
    { name: 'Dried Oregano', category: 'Spices & Seasonings', default_unit: 'teaspoon' },
    { name: 'Cinnamon', category: 'Spices & Seasonings', default_unit: 'teaspoon' },
    { name: 'Garlic Powder', category: 'Spices & Seasonings', default_unit: 'teaspoon' },

    // Frozen Foods
    { name: 'Frozen Peas', category: 'Frozen Foods', default_unit: 'gram' },
    { name: 'Frozen Berries', category: 'Frozen Foods', default_unit: 'gram' },
    { name: 'Vanilla Ice Cream', category: 'Frozen Foods', default_unit: 'liter' },
    { name: 'Frozen Pizza', category: 'Frozen Foods', default_unit: 'piece' },

    // Snacks
    { name: 'Potato Chips', category: 'Snacks', default_unit: 'gram' },
    { name: 'Pretzels', category: 'Snacks', default_unit: 'gram' },
    { name: 'Almonds', category: 'Snacks', default_unit: 'gram' },
    { name: 'Dark Chocolate', category: 'Snacks', default_unit: 'gram' },

    // Beverages
    { name: 'Coffee Beans', category: 'Beverages', default_unit: 'kilogram' },
    { name: 'Earl Grey Tea', category: 'Beverages', default_unit: 'piece' },
    { name: 'Orange Juice', category: 'Beverages', default_unit: 'liter' },
    { name: 'Cola', category: 'Beverages', default_unit: 'can' },
  ],
  items: [
    // Fridge Items
    {
      ingredient: 'Milk',
      label: 'Milk',
      quantity: 0.5,
      unit: 'liter',
      location: 'Fridge',
      expiration_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Expired 2 days ago
      purchase_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: 'Smells funny?',
    },
    {
      ingredient: 'Milk',
      label: 'Fresh Milk',
      quantity: 2,
      unit: 'liter',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Fresh
      purchase_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Large Eggs',
      label: 'Large Eggs',
      quantity: 12,
      unit: 'piece',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Cheddar Cheese',
      label: 'Cheddar Cheese',
      quantity: 250,
      unit: 'gram',
      location: 'Fridge',
      purchase_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Added explicit expiration for consistency, though not strictly required by types if optional? Schema says NOT NULL for expiration_date.
      notes: 'Sharp cheddar',
    },
    {
      ingredient: 'Spinach',
      label: 'Spinach',
      quantity: 300,
      unit: 'gram',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Expiring tomorrow!
      purchase_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Greek Yogurt',
      label: 'Greek Yogurt',
      quantity: 500,
      unit: 'gram',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Unsalted Butter',
      label: 'Unsalted Butter',
      quantity: 200,
      unit: 'gram',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Mayonnaise',
      label: 'Mayonnaise',
      quantity: 400,
      unit: 'milliliter',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      opened_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: 'Opened last week',
    },
    {
      ingredient: 'Dijon Mustard',
      label: 'Dijon Mustard',
      quantity: 5,
      unit: 'teaspoon',
      location: 'Fridge',
      expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },

    // Pantry Items
    {
      ingredient: 'All-Purpose Flour',
      label: 'All-Purpose Flour',
      quantity: 1.5,
      unit: 'kilogram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Granulated Sugar',
      label: 'Granulated Sugar',
      quantity: 1,
      unit: 'kilogram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Spaghetti',
      label: 'Spaghetti',
      quantity: 500,
      unit: 'gram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Basmati Rice',
      label: 'Basmati Rice',
      quantity: 5,
      unit: 'kilogram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      notes: 'Large bag from Costco',
    },
    {
      ingredient: 'Chickpeas',
      label: 'Chickpeas',
      quantity: 3,
      unit: 'can',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Diced Tomatoes',
      label: 'Diced Tomatoes',
      quantity: 4,
      unit: 'can',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Olive Oil',
      label: 'Olive Oil',
      quantity: 750,
      unit: 'milliliter',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Salt',
      label: 'Salt',
      quantity: 300,
      unit: 'gram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Black Pepper',
      label: 'Black Pepper',
      quantity: 50,
      unit: 'gram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Honey',
      label: 'Honey',
      quantity: 250,
      unit: 'milliliter',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Peanut Butter',
      label: 'Peanut Butter',
      quantity: 500,
      unit: 'gram',
      location: 'Pantry',
      expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },

    // Shelf Items
    {
      ingredient: 'Apples',
      label: 'Apples',
      quantity: 6,
      unit: 'piece',
      location: 'Shelf',
      expiration_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Bananas',
      label: 'Bananas',
      quantity: 4,
      unit: 'piece',
      location: 'Shelf',
      expiration_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: 'Getting ripe, good for banana bread soon',
    },
    {
      ingredient: 'Onions',
      label: 'Onions',
      quantity: 5,
      unit: 'piece',
      location: 'Shelf',
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Potatoes',
      label: 'Potatoes',
      quantity: 2,
      unit: 'kilogram',
      location: 'Shelf',
      expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },

    // Freezer Items
    {
      ingredient: 'Frozen Peas',
      label: 'Frozen Peas',
      quantity: 500,
      unit: 'gram',
      location: 'Freezer',
      expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Frozen Pizza',
      label: 'Frozen Pizza',
      quantity: 2,
      unit: 'piece',
      location: 'Freezer',
      expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      notes: 'Emergency dinner',
    },
    {
      ingredient: 'Chicken Breast',
      label: 'Chicken Breast',
      quantity: 1,
      unit: 'kilogram',
      location: 'Freezer',
      expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      ingredient: 'Vanilla Ice Cream',
      label: 'Vanilla Ice Cream',
      quantity: 1,
      unit: 'gram',
      location: 'Freezer',
      expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ],
  recipes: [
    {
      name: 'Classic Pancakes',
      description: 'Fluffy and golden pancakes, perfect for a weekend breakfast.',
      difficulty: 'Easy',
      servings: 4,
      prep_time: 10,
      cook_time: 15,
      ingredients: [
        { ingredient: 'All-Purpose Flour', quantity: 250, unit: 'gram' },
        { ingredient: 'Granulated Sugar', quantity: 2, unit: 'tablespoon' },
        { ingredient: 'Baking Powder', quantity: 2, unit: 'teaspoon' },
        { ingredient: 'Salt', quantity: 0.5, unit: 'teaspoon' },
        { ingredient: 'Milk', quantity: 300, unit: 'milliliter' },
        { ingredient: 'Large Eggs', quantity: 1, unit: 'piece' },
        { ingredient: 'Unsalted Butter', quantity: 45, unit: 'gram' },
        { ingredient: 'Vanilla Extract', quantity: 1, unit: 'teaspoon' },
      ],
      steps: [
        {
          step_number: 1,
          instruction_text:
            'In a large bowl, whisk together flour, sugar, baking powder, and salt.',
        },
        {
          step_number: 2,
          instruction_text:
            'In a separate bowl, whisk together milk, egg, melted butter, and vanilla.',
        },
        {
          step_number: 3,
          instruction_text:
            'Pour the wet ingredients into the dry ingredients and stir until just combined. Lumps are okay!',
        },
        {
          step_number: 4,
          instruction_text: 'Heat a non-stick pan or griddle over medium heat. Grease lightly.',
        },
        {
          step_number: 5,
          instruction_text:
            'Pour 1/4 cup of batter for each pancake. Cook until bubbles form on the surface, then flip and cook until golden brown.',
          timer_seconds: 180, // 3 mins
        },
      ],
    },
    {
      name: 'Spaghetti with Marinara',
      description: 'A quick and easy weeknight pasta dish.',
      difficulty: 'Easy',
      servings: 2,
      prep_time: 5,
      cook_time: 15,
      ingredients: [
        { ingredient: 'Spaghetti', quantity: 200, unit: 'gram' },
        { ingredient: 'Marinara Sauce', quantity: 300, unit: 'milliliter' },
        { ingredient: 'Olive Oil', quantity: 1, unit: 'tablespoon' },
        { ingredient: 'Parmesan Cheese', quantity: 20, unit: 'gram' },
      ],
      steps: [
        {
          step_number: 1,
          instruction_text: 'Bring a large pot of salted water to a boil.',
        },
        {
          step_number: 2,
          instruction_text: 'Add spaghetti and cook until al dente.',
          timer_seconds: 600, // 10 mins
        },
        {
          step_number: 3,
          instruction_text:
            'While pasta cooks, heat the marinara sauce in a saucepan over medium heat.',
        },
        {
          step_number: 4,
          instruction_text: 'Drain the pasta and toss with the warm sauce.',
        },
        {
          step_number: 5,
          instruction_text: 'Serve topped with grated Parmesan cheese and a drizzle of olive oil.',
        },
      ],
    },
    {
      name: 'Greek Salad',
      description: 'Fresh and healthy salad with Mediterranean flavors.',
      difficulty: 'Easy',
      servings: 2,
      prep_time: 15,
      cook_time: 0,
      ingredients: [
        { ingredient: 'Tomatoes', quantity: 3, unit: 'piece' },
        { ingredient: 'Avocados', quantity: 1, unit: 'piece' }, // Creative twist
        { ingredient: 'Onions', quantity: 0.5, unit: 'piece' },
        { ingredient: 'Feta Cheese', quantity: 100, unit: 'gram' },
        { ingredient: 'Olive Oil', quantity: 2, unit: 'tablespoon' },
        { ingredient: 'Dried Oregano', quantity: 1, unit: 'teaspoon' },
      ],
      steps: [
        {
          step_number: 1,
          instruction_text: 'Chop tomatoes and avocado into bite-sized chunks.',
        },
        {
          step_number: 2,
          instruction_text: 'Slice the onion thinly.',
        },
        {
          step_number: 3,
          instruction_text: 'Combine vegetables in a bowl.',
        },
        {
          step_number: 4,
          instruction_text:
            'Top with crumbled feta cheese, drizzle with olive oil, and sprinkle with oregano.',
        },
      ],
    },
    {
      name: 'Chicken Curry',
      description: 'Flavorful chicken curry with coconut milk.',
      difficulty: 'Medium',
      servings: 4,
      prep_time: 20,
      cook_time: 30,
      ingredients: [
        { ingredient: 'Chicken Breast', quantity: 500, unit: 'gram' },
        { ingredient: 'Onions', quantity: 1, unit: 'piece' },
        { ingredient: 'Garlic', quantity: 3, unit: 'clove' },
        { ingredient: 'Coconut Milk', quantity: 400, unit: 'milliliter' },
        { ingredient: 'Vegetable Oil', quantity: 1, unit: 'tablespoon' },
        { ingredient: 'Cumin', quantity: 1, unit: 'teaspoon' },
        { ingredient: 'Paprika', quantity: 1, unit: 'teaspoon' },
        { ingredient: 'Basmati Rice', quantity: 300, unit: 'gram' },
      ],
      steps: [
        {
          step_number: 1,
          instruction_text: 'Dice the chicken into cubes. Chop onion and mince garlic.',
        },
        {
          step_number: 2,
          instruction_text: 'Heat oil in a pan. Sauté onions and garlic until soft.',
        },
        {
          step_number: 3,
          instruction_text:
            'Add chicken and spices (cumin, paprika) and cook until chicken is browned.',
        },
        {
          step_number: 4,
          instruction_text:
            'Pour in coconut milk and simmer for 15-20 minutes until chicken is cooked through and sauce thickens.',
          timer_seconds: 900, // 15 mins
        },
        {
          step_number: 5,
          instruction_text: 'Serve hot over steamed basmati rice.',
        },
      ],
    },
    {
      name: 'Banana Bread',
      description: 'Moist and delicious way to use up overripe bananas.',
      difficulty: 'Medium',
      servings: 8,
      prep_time: 15,
      cook_time: 60,
      ingredients: [
        { ingredient: 'Bananas', quantity: 3, unit: 'piece' },
        { ingredient: 'All-Purpose Flour', quantity: 250, unit: 'gram' },
        { ingredient: 'Granulated Sugar', quantity: 150, unit: 'gram' },
        { ingredient: 'Unsalted Butter', quantity: 75, unit: 'gram' },
        { ingredient: 'Large Eggs', quantity: 1, unit: 'piece' },
        { ingredient: 'Baking Powder', quantity: 1, unit: 'teaspoon' },
        { ingredient: 'Cinnamon', quantity: 1, unit: 'teaspoon' },
        { ingredient: 'Vanilla Extract', quantity: 1, unit: 'teaspoon' },
      ],
      steps: [
        {
          step_number: 1,
          instruction_text: 'Preheat oven to 350°F (175°C). Grease a loaf pan.',
        },
        {
          step_number: 2,
          instruction_text: 'Mash the ripe bananas in a bowl.',
        },
        {
          step_number: 3,
          instruction_text: 'Mix in melted butter, then sugar, egg, and vanilla.',
        },
        {
          step_number: 4,
          instruction_text: 'Sprinkle baking powder and cinnamon over the banana mixture.',
        },
        {
          step_number: 5,
          instruction_text: 'Gently stir in the flour until just incorporated.',
        },
        {
          step_number: 6,
          instruction_text: 'Pour batter into the loaf pan and bake for 60 minutes.',
          timer_seconds: 3600, // 60 mins
        },
      ],
    },
  ],
};
