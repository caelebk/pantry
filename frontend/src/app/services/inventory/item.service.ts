import { Injectable } from '@angular/core';
import { Item } from '../../models/items.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly apiUrl = 'http://localhost:8000/api/items';

  constructor(private http: HttpClient) { }

  getItems(): Item[] {
    return [];
  }

  addItem(item: Item) {
    
  }

  removeItem(item: Item) {
  }

  updateItem(oldItem: Item, newItem: Item) {
  }
}
