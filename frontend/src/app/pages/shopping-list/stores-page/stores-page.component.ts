import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Store } from '@models/store.model';
import { StoreService } from '@services/store.service';
import { BadgeComponent } from '@ui';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'pantry-stores-page',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, TranslocoPipe, BadgeComponent],
  templateUrl: './stores-page.component.html',
})
export class StoresPageComponent implements OnInit {
  private readonly service = inject(StoreService);
  private readonly router = inject(Router);
  readonly stores = signal<Store[]>([]);
  readonly draftNames = signal<Record<string, string>>({});
  readonly newStoreName = signal<string>('');
  readonly isCreating = signal<boolean>(false);
  readonly editingStoreId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getStores().subscribe((stores) => {
      this.stores.set(stores);
      this.draftNames.set(Object.fromEntries(stores.map((store) => [store.id, store.name])));
    });
  }

  startEditing(store: Store): void {
    this.setDraftName(store.id, store.name);
    this.editingStoreId.set(store.id);
  }

  cancelEditing(): void {
    this.editingStoreId.set(null);
  }

  createStore(): void {
    const name = this.newStoreName().trim();
    if (!name || this.isCreating()) return;

    this.isCreating.set(true);
    this.service.createStore(name).subscribe({
      next: () => {
        this.newStoreName.set('');
        this.isCreating.set(false);
        this.load();
      },
      error: () => {
        this.isCreating.set(false);
      },
    });
  }

  save(store: Store): void {
    const name = this.draftNames()[store.id]?.trim();
    if (!name) return;
    this.service.updateStore(store.id, { name }).subscribe(() => {
      this.editingStoreId.set(null);
      this.load();
    });
  }

  setDraftName(id: string, name: string): void {
    this.draftNames.update((draft) => ({ ...draft, [id]: name }));
  }

  archive(store: Store): void {
    this.service.updateStore(store.id, { archived: !store.archived }).subscribe(() => this.load());
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
