import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
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
});
