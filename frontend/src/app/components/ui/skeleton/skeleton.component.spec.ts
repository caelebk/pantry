import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SkeletonComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
  });

  it('should render correct number of skeleton items', () => {
    expect(component).toBeTruthy();
    fixture.componentRef.setInput('count', 3);
    fixture.componentRef.setInput('variant', 'row');
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.animate-pulse');
    expect(items.length).toBe(3);
  });

  it('should label the container with the translated default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy]').getAttribute('aria-label')).toBe(
      translations.common.loadingContent,
    );
  });
});
