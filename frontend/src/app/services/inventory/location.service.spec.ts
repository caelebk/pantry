import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LocationDTO } from '@models/location.model';
import { firstValueFrom } from 'rxjs';
import { Kitchen } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;
  let httpMock: HttpTestingController;

  const mockLocations: LocationDTO[] = [
    { id: 1, name: 'Fridge' },
    { id: 2, name: 'Pantry' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LocationService],
    });

    service = TestBed.inject(LocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all locations', async () => {
    const promise = firstValueFrom(service.getLocations());

    const req = httpMock.expectOne('/api/v1/locations');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', data: mockLocations });

    const locations = await promise;
    expect(locations.length).toBe(2);
    expect(locations[0].name).toBe('Fridge');
  });

  it('should refetch locations when the active kitchen changes', async () => {
    const authService = TestBed.inject(AuthService);
    authService.activeKitchen.set({ id: 'kitchen-1' } as Kitchen);

    const first = firstValueFrom(service.getLocations());
    httpMock.expectOne('/api/v1/locations').flush({ status: 'success', data: mockLocations });
    expect((await first).length).toBe(2);

    authService.activeKitchen.set({ id: 'kitchen-2' } as Kitchen);
    const second = firstValueFrom(service.getLocations());
    httpMock
      .expectOne('/api/v1/locations')
      .flush({ status: 'success', data: [{ id: 3, name: 'Freezer' }] });

    const locations = await second;
    expect(locations.length).toBe(1);
    expect(locations[0].name).toBe('Freezer');
  });
});
