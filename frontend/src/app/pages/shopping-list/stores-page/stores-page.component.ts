import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Store } from '@models/store.model';
import { StoreService } from '@services/store.service';
import { ToastService } from '@services/toast.service';
import { BadgeComponent, CardComponent, EmptyStateComponent, FormFieldComponent } from '@ui';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'pantry-stores-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TranslocoPipe,
    BadgeComponent,
    CardComponent,
    EmptyStateComponent,
    FormFieldComponent,
  ],
  templateUrl: './stores-page.component.html',
})
export class StoresPageComponent implements OnInit {
  private readonly service = inject(StoreService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
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
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLInputElement>('input[data-edit-input]')?.focus(),
      { injector: this.injector },
    );
  }

  cancelEditing(): void {
    const id = this.editingStoreId();
    this.editingStoreId.set(null);
    if (id) this.focusRenameButton(id);
  }

  private focusRenameButton(id: string): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-rename-id="${CSS.escape(id)}"]`)
          ?.focus(),
      { injector: this.injector },
    );
  }

  private showError(key: string): void {
    this.toast.showError(this.transloco.translate(key));
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
        this.showError('stores.errors.create');
      },
    });
  }

  save(store: Store): void {
    const name = this.draftNames()[store.id]?.trim();
    if (!name) return;
    this.service.updateStore(store.id, { name }).subscribe({
      next: () => {
        this.editingStoreId.set(null);
        this.focusRenameButton(store.id);
        this.load();
      },
      error: () => this.showError('stores.errors.rename'),
    });
  }

  setDraftName(id: string, name: string): void {
    this.draftNames.update((draft) => ({ ...draft, [id]: name }));
  }

  archive(store: Store): void {
    this.service.updateStore(store.id, { archived: !store.archived }).subscribe({
      next: () => this.load(),
      error: () => this.showError('stores.errors.archive'),
    });
  }

  goBack(): void {
    this.router.navigate(['/shopping-list']);
  }
}
