import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Location } from '@models/location.model';
import { Unit, UnitType } from '@models/unit.model';
import { of } from 'rxjs';
import { ItemService } from './item.service';
import { LocationService } from './location.service';
import { UnitService } from './unit.service';

describe('ItemService', () => {
  let service: ItemService;
  let httpMock: HttpTestingController;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockLocationService: jasmine.SpyObj<LocationService>;

  const mockUnits: Unit[] = [
    { id: 1, name: 'pcs', shortName: 'pcs', type: UnitType.Count, toBaseFactor: 1 },
  ];

  const mockLocations: Location[] = [{ id: 1, name: 'Fridge' }];

  beforeEach(() => {
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockLocationService = jasmine.createSpyObj('LocationService', ['getLocations']);

    mockUnitService.getUnits.and.returnValue(of(mockUnits));
    mockLocationService.getLocations.and.returnValue(of(mockLocations));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ItemService,
        { provide: UnitService, useValue: mockUnitService },
        { provide: LocationService, useValue: mockLocationService },
      ],
    });

    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/ingredient-items/similarity and map response data', (done) => {
    const mockApiResponse = {
      success: true,
      data: [
        {
          item: {
            id: 'item-1',
            label: 'Olive Oil (Extra Virgin)',
            quantity: 2,
            unitId: 1,
            locationId: 1,
            purchaseDate: '2026-08-01T00:00:00.000Z',
            expirationDate: '2026-08-20T00:00:00.000Z',
          },
          score: 0.85,
          tier: 'similar' as const,
        },
      ],
    };

    service.getSimilarIngredientItems('Olive Oil', 0.45).subscribe((candidates) => {
      expect(candidates.length).toBe(1);
      expect(candidates[0].item.name).toBe('Olive Oil (Extra Virgin)');
      expect(candidates[0].score).toBe(0.85);
      expect(candidates[0].tier).toBe('similar');
      done();
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === '/api/ingredient-items/similarity' &&
        request.params.get('name') === 'Olive Oil' &&
        request.params.get('minScore') === '0.45',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });
});
