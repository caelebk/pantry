import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';

let nextPaginationId = 0;

@Component({
  selector: 'pantry-data-table-pagination',
  standalone: true,
  imports: [FormsModule, SelectModule, TranslocoModule],
  host: { class: 'block' },
  template: `
    <footer
      class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 px-4 py-3 border-t border-surface-200/70 dark:border-surface-700/70 text-surface-600 dark:text-surface-300">
      <div
        data-testid="pagination-summary"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="type-meta min-w-0 tabular-nums">
        <span>{{
          'pagination.showingSummary'
            | transloco
              : {
                  from: totalItems() === 0 ? 0 : startIndex() + 1,
                  to: endIndex(),
                  total: totalItems(),
                  label: itemLabel(),
                }
        }}</span>
        <span class="sr-only"
          >.
          {{
            'pagination.pageState' | transloco: { page: currentPage(), total: totalPages() }
          }}</span
        >
      </div>
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 min-w-0">
        <div class="flex items-center gap-2 shrink-0">
          <label [for]="inputId" class="type-meta whitespace-nowrap">
            <span class="sm:hidden">{{ 'pagination.rowsLabel' | transloco }}</span>
            <span class="hidden sm:inline">{{ 'pagination.perPageLabel' | transloco }}</span>
          </label>
          <p-select
            [inputId]="inputId"
            [ngModel]="pageSize()"
            (ngModelChange)="onPageSizeChange($event)"
            [options]="pageSizeOptions()"
            styleClass="min-w-20"
            appendTo="body"
            [ariaLabel]="'pagination.perPageAria' | transloco: { label: itemLabel() }" />
        </div>
        <nav
          class="flex items-center gap-1 shrink-0 ml-auto"
          [attr.aria-label]="'pagination.navigationAria' | transloco: { label: itemLabel() }">
          <button
            type="button"
            (click)="goToPage(1)"
            [disabled]="currentPage() === 1"
            class="btn-icon border-0! disabled:opacity-40 disabled:cursor-not-allowed hidden! sm:inline-flex!"
            [attr.aria-label]="'pagination.firstPage' | transloco"
            [attr.title]="'pagination.firstPage' | transloco">
            <i class="pi pi-angle-double-left" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() === 1"
            class="btn-icon border-0! disabled:opacity-40 disabled:cursor-not-allowed"
            [attr.aria-label]="'pagination.previousPage' | transloco"
            [attr.title]="'pagination.previousPage' | transloco">
            <i class="pi pi-angle-left" aria-hidden="true"></i>
          </button>
          <span class="type-meta whitespace-nowrap tabular-nums px-1">
            {{ 'pagination.pagePrefix' | transloco }}
            <span
              data-testid="page-number"
              aria-current="page"
              class="type-label text-surface-900 dark:text-white"
              >{{ currentPage() }}</span
            >
            {{ 'pagination.pageOf' | transloco: { total: totalPages() } }}
          </span>
          <button
            type="button"
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() >= totalPages()"
            class="btn-icon border-0! disabled:opacity-40 disabled:cursor-not-allowed"
            [attr.aria-label]="'pagination.nextPage' | transloco"
            [attr.title]="'pagination.nextPage' | transloco">
            <i class="pi pi-angle-right" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            (click)="goToPage(totalPages())"
            [disabled]="currentPage() >= totalPages()"
            class="btn-icon border-0! disabled:opacity-40 disabled:cursor-not-allowed hidden! sm:inline-flex!"
            [attr.aria-label]="'pagination.lastPage' | transloco"
            [attr.title]="'pagination.lastPage' | transloco">
            <i class="pi pi-angle-double-right" aria-hidden="true"></i>
          </button>
        </nav>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTablePaginationComponent {
  public readonly inputId = `pagination-page-size-${++nextPaginationId}`;

  public totalItems = input.required<number>();
  public currentPage = model<number>(1);
  public pageSize = model<number>(15);
  public pageSizeOptions = input<number[]>([10, 15, 25, 50]);
  public itemLabel = input<string>('items');

  public pageChange = output<number>();
  public pageSizeChange = output<number>();

  public totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);

  public startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());

  public endIndex = computed(() =>
    Math.min(this.startIndex() + this.pageSize(), this.totalItems()),
  );

  constructor() {
    effect(() => {
      const page = Math.max(1, Math.min(this.currentPage(), this.totalPages()));
      if (page !== this.currentPage()) {
        this.currentPage.set(page);
        this.pageChange.emit(page);
      }
    });
  }

  public goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.pageChange.emit(page);
    }
  }

  public onPageSizeChange(size: number | string): void {
    const newSize = Number(size);
    if (!Number.isInteger(newSize) || newSize <= 0 || newSize === this.pageSize()) {
      return;
    }
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.pageSizeChange.emit(newSize);
  }
}
