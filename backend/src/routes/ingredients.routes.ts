import { Hono } from 'https://deno.land/x/hono@v4.1.0/mod.ts';

const ingredients = new Hono();

ingredients.get('/', (c) => {
  return c.json({ message: 'Ingredients' });
});
ingredients.get('/:id', (c) => {
  return c.json({ message: 'Ingredient' });
});
ingredients.post('/', (c) => {
  return c.json({ message: 'Ingredient' });
});
ingredients.put('/:id', (c) => {
  return c.json({ message: 'Ingredient' });
});
ingredients.delete('/:id', (c) => {
  return c.json({ message: 'Ingredient' });
});

export default ingredients;
