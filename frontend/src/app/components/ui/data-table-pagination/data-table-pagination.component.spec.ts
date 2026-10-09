import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';
import translations from '../../../../../public/i18n/en.json';
import { DataTablePaginationComponent } from './data-table-pagination.component';

describe('DataTablePaginationComponent', () => {
  let component: DataTablePaginationComponent;
  let fixture: ComponentFixture<DataTablePaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DataTablePaginationComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTablePaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalItems', 47);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute total pages, start index, and end index', () => {
    expect(component.totalPages()).toBe(4);
    expect(component.startIndex()).toBe(0);
    expect(component.endIndex()).toBe(15);

    fixture.componentRef.setInput('currentPage', 4);
    fixture.detectChanges();
    expect(component.endIndex()).toBe(47);
  });

  it('should render the showing summary for the current range', () => {
    const summary = fixture.debugElement.query(By.css('[data-testid="pagination-summary"]'))
      .nativeElement as HTMLElement;
    expect(summary.textContent).toContain('1–15 of 47 items');
  });

  it('should show a zero range when there are no items', () => {
    fixture.componentRef.setInput('totalItems', 0);
    fixture.detectChanges();
    const summary = fixture.debugElement.query(By.css('[data-testid="pagination-summary"]'))
      .nativeElement as HTMLElement;
    expect(summary.textContent).toContain('0–0 of 0 items');
    expect(component.totalPages()).toBe(1);
  });

  it('should emit pageChange when navigating with next/prev/first/last buttons', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    fixture.componentRef.setInput('currentPage', 2);
    fixture.detectChanges();

    component.goToPage(3);
    component.goToPage(1);
    component.goToPage(4);
    expect(emitted).toEqual([3, 1, 4]);
    expect(component.currentPage()).toBe(4);
  });

  it('should ignore out-of-range or redundant page navigation', () => {
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));

    component.goToPage(0);
    component.goToPage(5);
    component.goToPage(1);

    expect(emitted).toEqual([]);
    expect(component.currentPage()).toBe(1);
  });

  it('should reset to page 1 and emit pageSizeChange when the page size changes', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();

    const emittedSizes: number[] = [];
    component.pageSizeChange.subscribe((size) => emittedSizes.push(size));

    component.onPageSizeChange(25);

    expect(emittedSizes).toEqual([25]);
    expect(component.pageSize()).toBe(25);
    expect(component.currentPage()).toBe(1);
  });

  it('shows one readable page indicator rather than a row of numbered buttons', () => {
    fixture.componentRef.setInput('currentPage', 3);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[data-testid="page-number"]').length).toBe(1);
    expect(root.querySelector('nav')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Page 3 of 4');
    expect(root.querySelector('button[data-testid="page-number"]')).toBeNull();
  });

  it('updates the range and page announcement when navigating through the controls', () => {
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('button[aria-label="Next Page"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(2);
    expect(root.querySelector('[role="status"]')?.textContent).toContain('16–30 of 47 items');
    expect(root.querySelector('[role="status"]')?.textContent).toContain('Page 2 of 4');
    (root.querySelector('button[aria-label="Last Page"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('[role="status"]')?.textContent).toContain('46–47 of 47 items');
  });

  it('labels the page-size selector and navigation landmark', () => {
    const root = fixture.nativeElement as HTMLElement;
    const label = root.querySelector(`label[for="${component.inputId}"]`);
    expect(label?.textContent).toContain('Rows per page');
    expect(root.querySelector(`#${component.inputId}`)?.getAttribute('aria-label')).toBe(
      'Rows per page for items',
    );
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('items pagination');
  });

  it('should disable prev controls on the first page and next controls on the last page', () => {
    const getByAriaLabel = (label: string) =>
      (fixture.debugElement
        .queryAll(By.css('button'))
        .find((de) => de.attributes['aria-label'] === label)?.nativeElement as
        | HTMLButtonElement
        | undefined) ?? null;

    expect(getByAriaLabel('First Page')!.disabled).toBeTrue();
    expect(getByAriaLabel('Previous Page')!.disabled).toBeTrue();
    expect(getByAriaLabel('Next Page')!.disabled).toBeFalse();
    expect(getByAriaLabel('Last Page')!.disabled).toBeFalse();

    fixture.componentRef.setInput('currentPage', 4);
    fixture.detectChanges();

    expect(getByAriaLabel('First Page')!.disabled).toBeFalse();
    expect(getByAriaLabel('Next Page')!.disabled).toBeTrue();
    expect(getByAriaLabel('Last Page')!.disabled).toBeTrue();
  });
  it('clamps the current page when filtering reduces the total', () => {
    fixture.componentRef.setInput('currentPage', 4);
    fixture.detectChanges();
    const emitted: number[] = [];
    component.pageChange.subscribe((page) => emitted.push(page));
    fixture.componentRef.setInput('totalItems', 2);
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);
    expect(component.startIndex()).toBe(0);
    expect(emitted).toEqual([1]);
  });

  it('identifies the current page semantically and announces state without pulsing', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(
      root.querySelector('[data-testid="page-number"][aria-current="page"]')?.textContent?.trim(),
    ).toBe('2');
    expect(root.querySelector('[data-testid="pagination-summary"]')?.getAttribute('role')).toBe(
      'status',
    );
    expect(root.querySelector('.animate-pulse')).toBeNull();
  });
});
