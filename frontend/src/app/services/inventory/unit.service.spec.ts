import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UnitDTO } from '@models/unit.model';
import { firstValueFrom } from 'rxjs';
import { UnitService } from './unit.service';

describe('UnitService', () => {
  let service: UnitService;
  let httpMock: HttpTestingController;

  const mockUnits: UnitDTO[] = [
    { id: 1, name: 'Gram', shortName: 'g', type: 'mass', baseFactor: 1 },
    { id: 2, name: 'Kilogram', shortName: 'kg', type: 'mass', baseFactor: 1000 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UnitService],
    });

    service = TestBed.inject(UnitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all units', async () => {
    const promise = firstValueFrom(service.getUnits());

    const req = httpMock.expectOne('/api/v1/units');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockUnits });

    const units = await promise;
    expect(units.length).toBe(2);
    expect(units[0].name).toBe('Gram');
  });

  it('should convert units via API endpoint', async () => {
    const promise = firstValueFrom(service.convertUnits(1000, 1, 2));

    const req = httpMock.expectOne('/api/v1/units/convert?quantity=1000&fromUnit=1&toUnit=2');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: 1 });

    const result = await promise;
    expect(result).toBe(1);
  });
});
