import { Injectable } from '@angular/core';
import { Item } from '../../models/items.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private items: Item[] = [];

  constructor() { }

  getItems(): Item[] {
    return this.items;
  }

  addItem(item: Item) {
    this.items.push(item);
  }

  removeItem(item: Item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }

  updateItem(oldItem: Item, newItem: Item) {
    const index = this.items.indexOf(oldItem);
    if (index > -1) {
      this.items[index] = newItem;
    }
  }
}
